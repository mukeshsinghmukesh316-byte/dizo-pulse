import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLayout } from './AdminLayout';
import * as Icons from 'lucide-react';
import { showToast } from '../../components/UIPolish';

interface AdminContentPageProps {
  navigate: (path: string) => void;
}

export const AdminContentPage: React.FC<AdminContentPageProps> = ({ navigate }) => {
  const [activeSection, setActiveSection] = useState<'hero' | 'faqs' | 'testimonials' | 'cta'>('hero');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Hero content state
  const [heroBadge, setHeroBadge] = useState('🔥 360° Full-Stack Digital Agency');
  const [heroTitle, setHeroTitle] = useState('Build. Scale. Dominate.');
  const [heroSubtitle, setHeroSubtitle] = useState(
    'From bespoke vector brand signatures to ultra-responsive web applications, viral 4K video edits, and ROI-focused paid campaigns — we build the engines that propel modern ventures.'
  );
  const [heroCtaText, setHeroCtaText] = useState('Calculate Custom Scope');
  const [heroCtaSecondary, setHeroCtaSecondary] = useState('Explore Services');

  // FAQs state
  const [faqs, setFaqs] = useState([
    {
      q: 'How quickly does project kickoff happen after approval?',
      a: 'Kickoff begins within 24 hours of proposal approval and milestone confirmation. You will receive immediate access to your private client portal.'
    },
    {
      q: 'Can I request revisions during deliverable review?',
      a: 'Yes, every package includes structured revision rounds with real-time feedback loops directly in your client portal.'
    },
    {
      q: 'How does digital milestone payment work?',
      a: 'We support instant UPI, Bank IMPS, and split milestone payments (50% upfront, 50% upon final signoff).'
    }
  ]);
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // Testimonials state
  const [testimonials, setTestimonials] = useState([
    {
      name: 'Mukesh Sharma',
      company: 'Aura Digital Labs',
      role: 'Founder & CEO',
      rating: 5,
      comment: 'Dizo Pulse revamped our entire brand identity and launched our React platform in under 10 days. The conversion lift was instantaneous.'
    },
    {
      name: 'Priya Patel',
      company: 'Zenith Apparel',
      role: 'Marketing Lead',
      rating: 5,
      comment: 'The 4K reels and ad creatives performed 3x better than our previous agency. The client portal is a breeze to review deliverables.'
    }
  ]);
  const [newTestimonialName, setNewTestimonialName] = useState('');
  const [newTestimonialCompany, setNewTestimonialCompany] = useState('');
  const [newTestimonialComment, setNewTestimonialComment] = useState('');

  // CTA Section state
  const [ctaTitle, setCtaTitle] = useState('Ready to Scale Your Brand to New Heights?');
  const [ctaSubtitle, setCtaSubtitle] = useState(
    'Connect with our digital strategy directors today or configure your custom quote in seconds.'
  );
  const [ctaButtonText, setCtaButtonText] = useState('Launch Instant Scoping');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && data.content) {
          if (data.content.hero) {
            setHeroBadge(data.content.hero.badge || heroBadge);
            setHeroTitle(data.content.hero.title || heroTitle);
            setHeroSubtitle(data.content.hero.subtitle || heroSubtitle);
            setHeroCtaText(data.content.hero.ctaText || heroCtaText);
            setHeroCtaSecondary(data.content.hero.ctaSecondary || heroCtaSecondary);
          }
          if (Array.isArray(data.content.faqs)) setFaqs(data.content.faqs);
          if (Array.isArray(data.content.testimonials)) setTestimonials(data.content.testimonials);
          if (data.content.cta) {
            setCtaTitle(data.content.cta.title || ctaTitle);
            setCtaSubtitle(data.content.cta.subtitle || ctaSubtitle);
            setCtaButtonText(data.content.cta.buttonText || ctaButtonText);
          }
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSaveAllContent = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            hero: {
              badge: heroBadge,
              title: heroTitle,
              subtitle: heroSubtitle,
              ctaText: heroCtaText,
              ctaSecondary: heroCtaSecondary
            },
            faqs,
            testimonials,
            cta: {
              title: ctaTitle,
              subtitle: ctaSubtitle,
              buttonText: ctaButtonText
            }
          }
        })
      });

      if (res.ok) {
        showToast('Content Saved', 'Website copy & sections updated live!', 'success');
      } else {
        showToast('Save Failed', 'Server error while updating content', 'error');
      }
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQ || !newFaqA) return;
    setFaqs([...faqs, { q: newFaqQ, a: newFaqA }]);
    setNewFaqQ('');
    setNewFaqA('');
    showToast('FAQ Added', 'Click Save Changes to publish', 'info');
  };

  const handleDeleteFaq = (index: number) => {
    setFaqs(faqs.filter((_, idx) => idx !== index));
  };

  const handleAddTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestimonialName || !newTestimonialComment) return;
    setTestimonials([
      ...testimonials,
      {
        name: newTestimonialName,
        company: newTestimonialCompany || 'Client Partner',
        role: 'Verified Client',
        rating: 5,
        comment: newTestimonialComment
      }
    ]);
    setNewTestimonialName('');
    setNewTestimonialCompany('');
    setNewTestimonialComment('');
    showToast('Testimonial Added', 'Click Save Changes to publish', 'info');
  };

  const handleDeleteTestimonial = (index: number) => {
    setTestimonials(testimonials.filter((_, idx) => idx !== index));
  };

  return (
    <AdminLayout
      activeTab="content"
      currentPath="/admin/content"
      navigate={navigate}
      requiredModule="content"
      pageTitle="Website Content & Copy Manager"
      contextualActions={{
        onRefreshData: () => window.location.reload()
      }}
    >
      {/* Navigation tabs & Save Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'hero', label: 'Hero Section', icon: 'Sparkles' },
            { key: 'faqs', label: 'FAQs Engine', icon: 'HelpCircle' },
            { key: 'testimonials', label: 'Client Reviews', icon: 'Star' },
            { key: 'cta', label: 'Bottom Banner CTA', icon: 'Send' }
          ].map(tab => {
            const IconComp = (Icons as any)[tab.icon] || Icons.FileText;
            const isActive = activeSection === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSaveAllContent}
          disabled={isSaving}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          {isSaving ? (
            <>
              <Icons.Loader2 className="w-4 h-4 animate-spin" />
              <span>Publishing...</span>
            </>
          ) : (
            <>
              <Icons.Save className="w-4 h-4" />
              <span>Publish Live Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Hero Section Tab */}
      {activeSection === 'hero' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 max-w-3xl">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Icons.Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Homepage Hero Banner</h3>
              <p className="text-[11px] text-slate-400">Headlines, value propositions, and action prompts</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Top Pill Eyebrow Badge
              </label>
              <input
                type="text"
                value={heroBadge}
                onChange={e => setHeroBadge(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-indigo-400 font-bold focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Primary Display Headline *
              </label>
              <input
                type="text"
                value={heroTitle}
                onChange={e => setHeroTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-black text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Sub-headline Value Proposition *
              </label>
              <textarea
                rows={3}
                value={heroSubtitle}
                onChange={e => setHeroSubtitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Primary Action Button Text
                </label>
                <input
                  type="text"
                  value={heroCtaText}
                  onChange={e => setHeroCtaText(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Secondary Action Button Text
                </label>
                <input
                  type="text"
                  value={heroCtaSecondary}
                  onChange={e => setHeroCtaSecondary(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQs Section Tab */}
      {activeSection === 'faqs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add FAQ Form */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 h-fit">
            <h3 className="text-sm font-black text-white">Add New FAQ Item</h3>
            <form onSubmit={handleAddFaq} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Question *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. What is your turnaround time?"
                  value={newFaqQ}
                  onChange={e => setNewFaqQ(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Answer *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain clearly in 2-3 sentences..."
                  value={newFaqA}
                  onChange={e => setNewFaqA(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Icons.Plus className="w-4 h-4" />
                <span>Add to List</span>
              </button>
            </form>
          </div>

          {/* FAQs List */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
            <h3 className="text-sm font-black text-white">Published FAQs ({faqs.length})</h3>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="text-indigo-400 font-mono">Q{idx + 1}.</span>
                      {faq.q}
                    </h4>
                    <button
                      onClick={() => handleDeleteFaq(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete Question"
                    >
                      <Icons.Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Testimonials Section Tab */}
      {activeSection === 'testimonials' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 h-fit">
            <h3 className="text-sm font-black text-white">Add Client Review</h3>
            <form onSubmit={handleAddTestimonial} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Malhotra"
                  value={newTestimonialName}
                  onChange={e => setNewTestimonialName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Company / Venture Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Health Tech"
                  value={newTestimonialCompany}
                  onChange={e => setNewTestimonialCompany(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Client Review / Testimonial *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="The deliverables exceeded our expectations..."
                  value={newTestimonialComment}
                  onChange={e => setNewTestimonialComment(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Icons.Plus className="w-4 h-4" />
                <span>Add Review</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
            <h3 className="text-sm font-black text-white">Client Testimonials ({testimonials.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {testimonials.map((t, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2.5 relative flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex text-amber-400 gap-0.5">
                        {Array.from({ length: t.rating || 5 }).map((_, i) => (
                          <Icons.Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                      <button
                        onClick={() => handleDeleteTestimonial(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded-md cursor-pointer"
                      >
                        <Icons.Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 italic">"{t.comment}"</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60">
                    <h5 className="text-xs font-bold text-white">{t.name}</h5>
                    <span className="text-[10px] text-slate-500">{t.company}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA Section Tab */}
      {activeSection === 'cta' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 max-w-2xl">
          <h3 className="text-sm font-black text-white">Bottom Call-to-Action Card</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                CTA Card Title
              </label>
              <input
                type="text"
                value={ctaTitle}
                onChange={e => setCtaTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                CTA Card Subtitle
              </label>
              <textarea
                rows={2}
                value={ctaSubtitle}
                onChange={e => setCtaSubtitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                CTA Button Text
              </label>
              <input
                type="text"
                value={ctaButtonText}
                onChange={e => setCtaButtonText(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminContentPage;
