import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How does the 'Split Payment' advance contract work?",
    answer: "We offer an extremely client-friendly 50/50 split system (or customize it in settings). You pay a 50% advance to boot up the design pipeline, check our revisions in real-time, and transfer the remaining 50% after launching the final assets. All receipts can be verified instantly by sending them to our founders over WhatsApp."
  },
  {
    question: "What is the typical turnaround timeline for deliverables?",
    answer: "Turnaround times vary by package. Branding stylebooks and social post templates are ready within 3-5 days. High-converting React/Tailwind web landing pages are fully launched and SEO-indexed within 7-10 working days. Reel video styling files are compiled within 4 days."
  },
  {
    question: "How many design revision loops do we get?",
    answer: "We believe in pixel-perfection. All standard client scopes include up to 3 major revision loops. In these cycles, you can directly interface with our design staff over our Unified Workspace, suggest custom edits, and tune assets before finalize launch."
  },
  {
    question: "How can I apply the surprise lucky coupon code?",
    answer: "Simply spin our 'Lucky Growth Wheel', copy the surprise code (e.g. PULSE50), paste it into the coupon input box in the 'Quote Estimator' panel, and hit apply! The grand total will immediately reduce in real-time."
  },
  {
    question: "Is the AI Consultant (PulseAI) trained on real metrics?",
    answer: "Yes! PulseAI is built directly into our full-stack server-side marketing intelligence center. It understands localized search engine priority metrics, viral Instagram reel pacing guidelines, and target CPA ad bidding budgets to offer immediate, strategic CMO-level consultation."
  },
  {
    question: "How can I connect with founder Mukesh Singh directly?",
    answer: "You can send an email to mukeshsinghmukesh316@gmail.com, or directly use the WhatsApp chat trigger in the Quote Estimator once you've generated a custom proposal. We respond within minutes to scale our client partnerships!"
  }
];

export default function FaqSection({ content }: { content?: any }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggleIdx = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  const faqItems = content?.items || FAQ_ITEMS;
  const headingText = content?.heading || 'Got Questions? We Have Answers';
  const subheadingText = content?.subheading || 'Learn about our secure digital escrow, revision protocols, staff interaction channels, and brand-building timelines.';

  return (
    <div className="py-12 bg-slate-900 rounded-3xl px-6 md:px-12 border border-slate-800 text-white relative overflow-hidden shadow-sm" id="faq-accordions">
      <div className="max-w-4xl mx-auto text-center mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-800/80 text-indigo-300 text-xs font-bold tracking-wider uppercase">
          <Icons.HelpCircle className="w-3.5 h-3.5" />
          Frequently Asked Questions
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3 tracking-tight">
          {headingText}
        </h2>
        <p className="text-slate-400 mt-2 text-sm md:text-base max-w-2xl mx-auto">
          {subheadingText}
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3.5 relative z-10">
        {faqItems.map((item: any, idx: number) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="bg-slate-950/45 border border-slate-800/85 rounded-2xl overflow-hidden transition-colors hover:border-slate-700/60"
            >
              <button
                onClick={() => toggleIdx(idx)}
                className="w-full px-6 py-4.5 text-left flex justify-between items-center gap-4 transition-colors cursor-pointer group"
              >
                <span className="font-extrabold text-sm md:text-base text-slate-100 group-hover:text-indigo-400 transition-colors leading-snug">
                  {item.question}
                </span>
                <span className={`p-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 group-hover:text-indigo-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`}>
                  <Icons.ChevronDown className="w-4.5 h-4.5" />
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    <div className="px-6 pb-5 pt-1 text-xs md:text-sm text-slate-300 leading-relaxed border-t border-slate-900/80 font-medium">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
