import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Testimonial {
  id: string;
  name: string;
  businessName: string;
  rating: number;
  message: string;
  avatarColor: string;
  date: string;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    name: 'Sandeep Juneja',
    businessName: 'Juneja Furnitures & Decors',
    rating: 5,
    message: 'The Reels campaign Dizo Pulse edited for us got over 250k organic views inside 10 days! Our showroom received more direct inquiries than we had in the entire past quarter. High quality hooks and pacing.',
    avatarColor: 'bg-indigo-600',
    date: '2026-06-12'
  },
  {
    id: 't-2',
    name: 'Dr. Neha Kapoor',
    businessName: 'Aesthetic Dental Care Clinic',
    rating: 5,
    message: 'Excellent Google Maps and Local SEO strategy. We rank #1 in our locality now for dental implants. The WhatsApp automation setup instantly replies to midnight booking queries.',
    avatarColor: 'bg-emerald-600',
    date: '2026-07-02'
  },
  {
    id: 't-3',
    name: 'Vikram Aditya',
    businessName: 'FitNation Premium Gym',
    rating: 5,
    message: 'Outstanding brand identity work! The luxury charcoal theme they crafted perfectly aligns with our high-end gym branding. Highly professional and responsive founders.',
    avatarColor: 'bg-rose-600',
    date: '2026-07-10'
  },
  {
    id: 't-4',
    name: 'Rohan Mehra',
    businessName: 'Brew & Byte Cafe Chain',
    rating: 4,
    message: 'Superb customer landing page build. Extremely fast load speeds, beautiful layout, and direct Shopify ordering synchronization. High value launch-prices are worth every rupee.',
    avatarColor: 'bg-amber-600',
    date: '2026-07-14'
  }
];

const AVATAR_COLORS = [
  'bg-indigo-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 
  'bg-purple-600', 'bg-sky-600', 'bg-fuchsia-600', 'bg-teal-600'
];

export default function TestimonialWall({ content }: { content?: any }) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  
  // Custom content from WebsiteContentManager
  const headingText = content?.heading || 'Trusted by Visionary Founders & Local Business Builders';
  const subheadingText = content?.subheading || 'Real feedback from businesses scaling with Dizo Pulse growth engines';
  const customItems = content?.items || [];
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formBusiness, setFormBusiness] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formMessage, setFormMessage] = useState('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    const local = localStorage.getItem('dizopulse_testimonials');
    if (local) {
      try {
        setTestimonials(JSON.parse(local));
      } catch {
        setTestimonials(DEFAULT_TESTIMONIALS);
      }
    } else {
      setTestimonials(DEFAULT_TESTIMONIALS);
      localStorage.setItem('dizopulse_testimonials', JSON.stringify(DEFAULT_TESTIMONIALS));
    }
  }, []);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formMessage.trim()) return;

    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const newReview: Testimonial = {
      id: 't-' + Date.now(),
      name: formName.trim(),
      businessName: formBusiness.trim() || 'Grower Partner',
      rating: formRating,
      message: formMessage.trim(),
      avatarColor: randomColor,
      date: new Date().toISOString().split('T')[0]
    };

    const updated = [newReview, ...testimonials];
    setTestimonials(updated);
    localStorage.setItem('dizopulse_testimonials', JSON.stringify(updated));

    // Reset Form
    setFormName('');
    setFormBusiness('');
    setFormRating(5);
    setFormMessage('');
    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setShowSubmitForm(false);
    }, 2000);
  };

  return (
    <div className="py-12 bg-slate-900 rounded-3xl px-6 md:px-12 border border-slate-800 text-white relative overflow-hidden shadow-sm" id="testimonial-wall">
      <div className="max-w-4xl mx-auto text-center mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800/80 text-emerald-300 text-xs font-bold tracking-wider uppercase">
          <Icons.Users className="w-3.5 h-3.5" />
          Client Success Stories
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3 tracking-tight">
          {headingText}
        </h2>
        <p className="text-slate-400 mt-2 text-sm md:text-base max-w-2xl mx-auto">
          {subheadingText}
        </p>
      </div>

      {/* Grid of Testimonials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
        <AnimatePresence mode="popLayout">
          {testimonials.map((t, idx) => (
            <motion.div
              layout
              key={t.id}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -15 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl relative flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-300 group"
            >
              {/* Quote Mark Decoration */}
              <span className="absolute top-4 right-6 text-6xl text-indigo-500/10 font-serif select-none pointer-events-none group-hover:text-indigo-500/20 transition-colors">
                “
              </span>

              <div className="space-y-4">
                {/* Star rating row */}
                <div className="flex gap-1">
                  {[...Array(5)].map((_, starIdx) => (
                    <Icons.Star
                      key={starIdx}
                      className={`w-4 h-4 ${
                        starIdx < t.rating ? 'text-yellow-400 fill-current' : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-slate-300 text-xs md:text-sm leading-relaxed italic">
                  "{t.message}"
                </p>
              </div>

              {/* Client Profile details */}
              <div className="flex items-center gap-3.5 mt-6 pt-4 border-t border-slate-800/60">
                <div className={`w-10 h-10 rounded-full ${t.avatarColor} flex items-center justify-center font-black text-sm text-white shadow-md uppercase`}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">{t.name}</h4>
                  <p className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wide mt-0.5">
                    {t.businessName} • {t.date}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Button to open submit review box */}
      <div className="mt-10 text-center relative z-10">
        {!showSubmitForm ? (
          <button
            onClick={() => setShowSubmitForm(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/30 hover:border-indigo-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-lg shadow-indigo-500/10"
          >
            <Icons.PlusCircle className="w-4 h-4" />
            Share Your Experience
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="max-w-lg mx-auto bg-slate-950/70 border border-slate-800 rounded-3xl p-6 md:p-8 text-left shadow-2xl relative mt-4 overflow-hidden"
          >
            <button
              onClick={() => setShowSubmitForm(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <Icons.X className="w-4.5 h-4.5" />
            </button>

            <h3 className="text-lg font-black text-white flex items-center gap-1.5 mb-1">
              <Icons.Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              Write Your Brand Review
            </h3>
            <p className="text-slate-400 text-xs mb-5 leading-normal">
              Your feedback is displayed instantly on our corporate wall! Help us refine our pixel-craft and delivery workflows.
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {formSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-900/50 rounded-xl text-xs text-emerald-400 font-medium flex items-center gap-2">
                  <Icons.CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                  <span>Review posted successfully onto client wall!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mukesh Kumar"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Business Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cafe De Coffee"
                    value={formBusiness}
                    onChange={(e) => setFormBusiness(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Star Rating picker */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Overall Rating</label>
                <div className="flex gap-1.5 py-1">
                  {[...Array(5)].map((_, idx) => {
                    const value = idx + 1;
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setFormRating(value)}
                        onMouseEnter={() => setHoverRating(value)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-0.5 focus:outline-none transition-transform active:scale-90 cursor-pointer"
                      >
                        <Icons.Star
                          className={`w-6 h-6 ${
                            value <= (hoverRating ?? formRating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-slate-700'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Review Message</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share your experience working with Dizo Pulse..."
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Submit Review Instantly
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
