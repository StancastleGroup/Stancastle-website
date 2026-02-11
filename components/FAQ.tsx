
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from './ui/Section';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const faqData = [
  {
    question: "Why wouldn't I just hire a consultant, coach, or agency instead?",
    answer: "Because they're solving different problems.\n\n**Consultants sell frameworks.** They deliver reports and leave you with 'your responsibility' implementation. **Coaches sell accountability.** They provide motivation, not strategic diagnosis. **Agencies sell execution.** They manage ads or operations, but if you hire them before you know what needs fixing, you're just executing faster in the wrong direction.\n\nStancastle fills the gap: the moment when you know something is wrong but can't see it clearly enough to fix it yourself. We diagnose first."
  },
  {
    question: "What if I can't clearly articulate what my problem is yet?",
    answer: "**That's exactly when this session has the highest ROI.**\n\nMost business owners feel friction long before they can name it. Revenue plateaus, hiring doesn't solve capacity, or marketing works but profit stays flat. The problem isn't that you don't know *something* is wrong; it's that you can't see it from inside the system.\n\nClarity is the deliverable. If you already had it, you wouldn't need this."
  },
  {
    question: "How do I know this won't just be obvious advice I could've figured out myself?",
    answer: "Because if it were obvious, you'd have already done it. The most valuable insights are the ones that feel obvious *in hindsight*—but were invisible from inside your business.\n\nWe don't provide a lack of information; we provide a lack of diagnosis. We show you what you're not seeing—the constraint hiding in plain sight, the decision you're avoiding, or the trade-off you haven't acknowledged."
  },
  {
    question: "What actually happens during the 90-minute session?",
    answer: "**You're not spending 90 minutes explaining your business.** We prepare for 3–4 hours analyzing your revenue model and constraints before we speak.\n\n* **Min 1–15:** Diagnosis presentation and confirmation.\n* **Min 16–60:** Stress-testing 2–3 viable paths against your actual constraints.\n* **Min 61–85:** Choosing the path and mapping the exact sequence of moves.\n* **Min 86–90:** Confirmation. You leave knowing exactly what to do next."
  },
  {
    question: "Who is this NOT for?",
    answer: "This service is selective. It is not for you if:\n\n* **You want validation, not clarity.**\n* **You aren't willing to hear uncomfortable truths.**\n* **You're still in the idea stage.** Strategy requires traction; if you haven't started, you need execution.\n* **You need hand-holding or emotional support.** This is analytical problem-solving, not life coaching."
  },
  {
    question: "How do I know you'll understand my specific industry or situation?",
    answer: "**The constraints that break businesses are universal.** Cash flow lags, hiring bottlenecks, and founder dependency look the same in SaaS as they do in Hospitality.\n\nWe've worked across food, property, SaaS, and e-commerce. Pattern recognition across contexts is our core strength. If your problem is strategic or structural ('why isn't this scaling?'), that's exactly what we are built for."
  },
  {
    question: "What happens after the session?",
    answer: "**Nothing, unless you want it to.** Some clients take the plan and execute independently. Others realize the problem isn't just diagnosis—it's ongoing execution support.\n\nThat's what the Partner Programme is for: monthly strategic sessions and direct WhatsApp access for thinking-partner support. The goal is clarity, not dependency."
  },
  {
    question: "What if I've already worked with consultants or coaches and it didn't help?",
    answer: "Then you already know what doesn't work. Most consultants optimize for looking smart with 40-slide decks. Most coaches optimize for keeping you subscribed by avoiding hard truths.\n\n**Stancastle is designed to be the opposite.** No performative strategy, no subscription dependency, and no avoidance of hard truths. If you don't leave with a clear path forward, you get a full refund within 24 hours."
  }
];

// Using React.FC handles the 'key' prop correctly when this component is used in a list.
const FAQItem: React.FC<{ 
  item: typeof faqData[0]; 
  isOpen: boolean; 
  onClick: () => void; 
}> = ({ item, isOpen, onClick }) => {
  return (
    <div className={`mb-4 transition-all duration-500 ${isOpen ? 'scale-[1.02]' : 'scale-100'}`}>
      <button
        onClick={onClick}
        className={`w-full text-left p-6 md:p-8 rounded-2xl border transition-all duration-300 flex justify-between items-center group ${
          isOpen 
            ? 'bg-white/[0.04] border-brand-accent shadow-[0_0_30px_rgba(217,70,239,0.1)]' 
            : 'bg-white/[0.02] border-white/5 hover:border-white/20'
        }`}
      >
        <span className={`text-lg md:text-xl font-bold transition-colors ${isOpen ? 'text-white' : 'text-brand-muted-light group-hover:text-white'}`}>
          {item.question}
        </span>
        <div className={`shrink-0 ml-4 p-2 rounded-lg transition-all duration-300 ${isOpen ? 'bg-brand-accent text-white rotate-180' : 'bg-white/5 text-brand-muted-light'}`}>
          {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="p-8 md:p-10 pt-4 text-brand-muted-light leading-relaxed text-lg whitespace-pre-wrap border-x border-b border-brand-accent/20 rounded-b-2xl bg-brand-accent/5">
              <div className="prose prose-invert max-w-none">
                {item.answer.split('\n\n').map((paragraph, i) => (
                  <p key={i} className={i !== 0 ? 'mt-4' : ''}>
                    {paragraph.split('**').map((part, j) => 
                      j % 2 === 1 ? <strong key={j} className="text-white font-bold">{part}</strong> : part
                    )}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section id="faq" className="relative pb-40">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center"
          >
            <div className="p-3 bg-brand-accent/10 rounded-2xl mb-6">
              <HelpCircle className="w-8 h-8 text-brand-accent" />
            </div>
            <h2 className="font-serif text-5xl md:text-6xl font-bold text-white mb-6">Strategic FAQ</h2>
            <p className="text-xl text-brand-muted-light max-w-2xl font-light">
              We address the hidden objections sophisticated business owners have before they commit.
            </p>
          </motion.div>
        </div>

        <div className="space-y-4">
          {faqData.map((item, index) => (
            <FAQItem 
              key={index} 
              item={item} 
              isOpen={openIndex === index} 
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        <div className="mt-20 p-8 rounded-3xl bg-gradient-to-r from-fuchsia-900/20 to-purple-900/20 border border-brand-accent/20 text-center">
          <h3 className="text-2xl font-serif font-bold text-white mb-4 italic">Still Have Questions?</h3>
          <p className="text-brand-muted-light mb-8">
            Our team is available for direct inquiries regarding multi-entity corporate structures or specific operational constraints.
          </p>
          <button 
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-brand-accent font-bold uppercase tracking-widest text-sm hover:text-white transition-colors"
          >
            Contact the Strategic Team →
          </button>
        </div>
      </div>
    </Section>
  );
};
