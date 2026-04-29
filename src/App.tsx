/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, CheckCircle2, ChevronRight, Menu, X, MessageCircle, Copy, Check, Layers } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import VoiceAgent from "./components/VoiceAgent";

const CopyEmail = ({ address }: { address: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [address]);

  return (
    <button 
      onClick={copy}
      className="p-2 text-slate-500 hover:text-brand-gold transition-colors relative"
      title="Copy email address"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <Check size={18} className="text-green-500" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <Copy size={18} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-8 flex justify-between items-center bg-brand-slate/80 backdrop-blur-md">
      <a href="/" className="flex items-center gap-3 group">
        <div className="relative">
          <Layers className="text-brand-gold relative z-10" size={22} />
          <div className="absolute -inset-1.5 bg-brand-gold/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500"></div>
        </div>
        <div className="text-xl font-serif tracking-tighter text-white flex items-baseline">
          SMN
        </div>
      </a>
      
      {/* Desktop Links */}
      <div className="hidden md:flex space-x-12 items-center">
        {["Problem", "Approach", "Services", "Process"].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase()}`}
            className="text-xs uppercase tracking-widest text-slate-400 hover:text-brand-gold transition-colors"
          >
            {item}
          </a>
        ))}
        <a 
          href="#connect" 
          className="bg-brand-gold text-brand-slate text-xs uppercase tracking-widest px-6 py-3 font-medium hover:bg-white transition-colors"
        >
          Connect
        </a>
      </div>

      {/* Mobile Toggle */}
      <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 w-full bg-brand-slate border-b border-white/5 p-8 flex flex-col space-y-6 md:hidden"
        >
          {["Problem", "Approach", "Services", "Process"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-2xl font-serif text-white px-4 py-2 border-l-2 border-transparent hover:border-brand-gold transition-all"
              onClick={() => setIsOpen(false)}
            >
              {item}
            </a>
          ))}
          <a 
            href="#connect" 
            className="w-full bg-brand-gold text-brand-slate py-4 font-medium text-center"
            onClick={() => setIsOpen(false)}
          >
            Connect
          </a>
        </motion.div>
      )}
    </nav>
  );
};

export default function App() {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: [0.21, 0.45, 0.32, 1] }
  };

  return (
    <div className="min-h-screen selection:bg-brand-gold/20">
      <Navigation />

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col justify-center px-6 lg:px-24">
        <div className="max-w-4xl">
          <motion.p 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-brand-gold uppercase tracking-[0.3em] text-xs font-medium mb-6"
          >
            Strategy Made New
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.21, 0.45, 0.32, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl leading-[1.15] tracking-tight mb-8 pt-2"
          >
            You don’t need another strategy. <br/>
            <span className="text-slate-500 italic">You need one that works.</span>
          </motion.h1>
          
          <div className="space-y-8">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="text-xl md:text-2xl text-white font-serif italic"
            >
              Strategy you can run. Stories people believe.
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="text-lg md:text-xl text-slate-400 font-light max-w-2xl leading-relaxed"
            >
              SMN helps organisations align how they operate with how they communicate — across people, systems, and story.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col sm:flex-row gap-6 mt-12"
          >
            <a 
              href="#connect" 
              className="bg-brand-gold text-brand-slate px-10 py-5 text-sm uppercase tracking-widest font-semibold hover:bg-white transition-all flex items-center group w-fit"
            >
              Start a conversation 
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
            </a>
          </motion.div>
        </div>
        
        {/* Abstract Scroll Indicator */}
        <div className="absolute bottom-12 left-6 lg:left-24 flex items-center gap-4">
          <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent"></div>
          <span className="text-[10px] uppercase tracking-widest text-slate-500">Scroll to Explore</span>
        </div>
      </section>

      {/* The Problem */}
      <section id="problem" className="py-24 md:py-32 lg:py-56 px-6 lg:px-24 bg-brand-accent/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-16 md:gap-32 items-start">
          <motion.div {...fadeInUp} className="md:w-1/3">
            <h2 className="text-3xl lg:text-4xl mb-4 leading-tight">
              Most strategies don’t fail on paper. <br/>
              <span className="text-brand-gold italic">They fail in the day-to-day.</span>
            </h2>
            <div className="w-12 h-px bg-brand-gold mt-6"></div>
          </motion.div>
          <motion.div {...fadeInUp} className="md:w-2/3 space-y-8">
            <div className="space-y-4">
              {[
                "Teams aren’t aligned",
                "Structures don’t support the work",
                "Systems slow things down",
                "And the story doesn’t land"
              ].map((point, i) => (
                <div key={i} className="flex items-center gap-4 text-xl lg:text-2xl text-slate-300 font-light">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-gold/40"></div>
                  {point}
                </div>
              ))}
            </div>
            <p className="text-xl lg:text-2xl leading-relaxed text-slate-400 font-light pt-8 border-t border-white/5">
              What looks clear in a deck becomes unclear in reality.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Point of View */}
      <section id="approach" className="py-24 md:py-32 lg:py-56 px-6 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-4xl lg:text-6xl max-w-5xl leading-tight mb-16">
            SMN works where <span className="text-brand-gold italic">strategy meets reality</span>.
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-12 text-xl lg:text-2xl text-slate-400 font-light leading-relaxed">
            <motion.p {...fadeInUp}>
              We focus on the parts most businesses overlook — how work actually happens, 
              how people experience it, and how clearly it’s understood.
            </motion.p>
            <motion.p {...fadeInUp}>
              Because if those things don’t align, strategy doesn’t stick.
            </motion.p>
          </div>
        </div>
      </section>

      {/* What We Do (Four Pillars) */}
      <section id="services" className="py-24 md:py-32 lg:py-56 px-6 lg:px-24 bg-brand-accent/20">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="mb-24 text-center">
            <h2 className="text-4xl lg:text-5xl mb-6 italic">What We Do</h2>
            <p className="text-slate-500 uppercase tracking-widest text-xs">Four Pillars of Mastery</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-1">
            {[
              { 
                title: "People & Culture", 
                desc: "Aligned, practical, built for how your organisation really works.",
                items: ["HR strategy", "Organisation design", "Leadership alignment"]
              },
              { 
                title: "Operations & Systems", 
                desc: "Clarity, structure, and ways of working that scale.",
                items: ["Operating models", "Process clarity", "Scalable systems"]
              },
              { 
                title: "Strategy & Narrative", 
                desc: "The story that connects it all — internally and externally.",
                items: ["Strategic storytelling", "Ghostwriting", "Messaging and positioning"]
              },
              { 
                title: "AI — Practical, Not Overwhelming", 
                desc: "Helping you find your footing in AI — without the hype or the overwhelm.",
                longDesc: "There’s a lot of noise around AI right now. What’s useful. What’s relevant. What actually applies to your business. SMN helps you cut through it — whether you’re just dipping a toe in or trying to figure out where it fits in how you work.",
                items: [
                  "AI orientation — plain-language guidance on what AI is and isn’t",
                  "Identifying where AI could genuinely help your business",
                  "Practical first steps — no jargon, no overwhelm",
                  "Helping teams and leaders get comfortable with the tools that matter"
                ]
              }
            ].map((pillar, idx) => (
              <motion.div 
                key={idx}
                {...fadeInUp}
                transition={{ delay: idx * 0.1 }}
                className="bg-brand-slate p-12 border border-white/5 hover:border-brand-gold/30 transition-colors group h-full flex flex-col"
              >
                <span className="text-brand-gold mb-8 block text-xs font-mono tracking-tighter">0{idx + 1}</span>
                <h3 className="text-2xl mb-6 group-hover:text-brand-gold transition-colors">{pillar.title}</h3>
                <p className="text-slate-300 leading-relaxed text-sm mb-6 font-medium italic">{pillar.desc}</p>
                {pillar.longDesc && (
                  <p className="text-slate-500 text-xs leading-relaxed mb-6">{pillar.longDesc}</p>
                )}
                <ul className="mt-auto space-y-3 pt-6 border-t border-white/5">
                  {pillar.items.map((item, i) => (
                    <li key={i} className="text-slate-400 text-[13px] flex items-start gap-3 leading-snug">
                      <span className="text-brand-gold mt-1.5 w-1 h-1 rounded-full shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="process" className="py-24 md:py-32 lg:py-56 px-6 lg:px-24 overflow-hidden bg-brand-slate">
        <div className="max-w-6xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-4xl lg:text-5xl mb-24 italic text-center">How It Works</motion.h2>
          
          <div className="grid md:grid-cols-4 gap-12">
            {[
              { step: "Understand", detail: "What’s really happening — beyond the surface." },
              { step: "Align", detail: "People, priorities, and direction." },
              { step: "Build", detail: "Practical solutions that work in reality." },
              { step: "Embed", detail: "So it lasts beyond the initial work." }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                {...fadeInUp}
                transition={{ delay: idx * 0.1 }}
                className="relative group"
              >
                <div className="text-brand-gold font-mono text-xs mb-6 px-3 py-1 border border-brand-gold/20 w-fit rounded-full">0{idx + 1}</div>
                <h3 className="text-2xl mb-4 group-hover:text-brand-gold transition-colors">{item.step}</h3>
                <p className="text-lg text-slate-400 font-light leading-relaxed">{item.detail}</p>
                {idx < 3 && (
                  <div className="hidden lg:block absolute -right-6 top-4 text-white/5 font-serif text-4xl">→</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Difference */}
      <section className="py-32 md:py-48 lg:py-64 px-6 lg:px-24 bg-brand-gold text-brand-slate text-center relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10 space-y-12">
          <motion.div {...fadeInUp} className="space-y-6">
            <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-snug">
              Most consultancies will give you a strategy. <br className="hidden md:block"/> Some will help you implement it.
            </p>
            <p className="text-3xl md:text-5xl lg:text-6xl font-serif italic leading-tight">
              Very few will help you make sense of it — <br className="hidden md:block"/> and bring people with you.
            </p>
          </motion.div>
          <motion.div {...fadeInUp} transition={{ delay: 0.4 }}>
            <div className="w-16 h-px bg-brand-slate/20 mx-auto my-12"></div>
            <p className="text-sm uppercase tracking-[0.4em] font-bold">That’s the difference.</p>
          </motion.div>
        </div>
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
      </section>

      {/* Credibility */}
      <section className="py-24 md:py-32 lg:py-56 px-6 lg:px-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-16 lg:gap-32">
          <motion.div {...fadeInUp} className="md:w-1/3">
            <h2 className="text-3xl lg:text-4xl mb-6 italic">Proof of Work</h2>
            <p className="text-slate-500 uppercase tracking-widest text-xs">Action, not just advice</p>
          </motion.div>
          <div className="md:w-2/3 space-y-12">
            {[
              "Built strategies that actually get used",
              "Aligned leadership teams through change",
              "Turned complex operations into clear, workable models",
              "Helped leaders articulate what their business really stands for"
            ].map((point, i) => (
              <motion.div 
                key={i} 
                {...fadeInUp} 
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-8 group"
              >
                <div className="w-px h-12 bg-brand-gold/30 group-hover:bg-brand-gold transition-colors shrink-0"></div>
                <p className="text-2xl md:text-3xl text-slate-300 font-light leading-snug">
                  {point}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Connect Section */}
      <section id="connect" className="py-24 md:py-32 lg:py-72 px-6 lg:px-24 border-t border-white/5 bg-brand-slate">
        <div className="max-w-4xl mx-auto text-center space-y-16">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl lg:text-5xl mb-8 leading-tight">
              If you’re rethinking how your organisation operates — or how it’s understood — <span className="text-brand-gold italic">we should talk.</span>
            </h2>
          </motion.div>

          <motion.div {...fadeInUp} className="space-y-12">
            <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
              <a 
                href="mailto:shaunamc77@hotmail.com" 
                className="bg-brand-gold text-brand-slate px-12 py-6 text-sm uppercase tracking-widest font-semibold hover:bg-white transition-all flex items-center justify-center group"
              >
                Start a conversation
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              </a>
              <a 
                href="https://linkedin.com/in/shauna-mc-naughton-2229b8261" 
                target="_blank"
                rel="noreferrer"
                className="border border-white/10 text-white px-12 py-6 text-sm uppercase tracking-widest font-semibold hover:bg-white hover:text-brand-slate transition-all flex items-center justify-center group"
              >
                Connect on LinkedIn
              </a>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 lg:gap-24 pt-16 border-t border-white/5 text-left">
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Principal Consultant</p>
                <h3 className="text-3xl md:text-4xl text-white">Shauna McNaughton</h3>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">LinkedIn Profile</p>
                <a 
                  href="https://linkedin.com/in/shauna-mc-naughton-2229b8261" 
                  target="_blank"
                  rel="noreferrer"
                  className="text-2xl md:text-3xl text-brand-gold font-serif hover:text-white transition-colors block truncate"
                >
                  Connect on LinkedIn
                </a>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Direct Line</p>
                <a href="tel:0861280725" className="text-2xl md:text-3xl text-brand-gold font-serif hover:text-white transition-colors block">
                  +353 086 128 0725
                </a>
              </div>
              <div className="space-y-4 group">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Email Correspondence</p>
                <div className="flex items-center gap-4">
                  <a href="mailto:shaunamc77@hotmail.com" className="text-2xl md:text-3xl text-brand-gold font-serif hover:text-white transition-colors block truncate">
                    shaunamc77@hotmail.com
                  </a>
                  <CopyEmail address="shaunamc77@hotmail.com" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 px-6 lg:px-24 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
        <div className="flex items-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all">
          <Layers className="text-brand-gold" size={18} />
          <div className="text-sm font-serif tracking-tighter text-white">
            SMN <span className="text-brand-gold/50 ml-1">©</span> 2026 Strategy Made New
          </div>
        </div>
        <div className="flex flex-wrap justify-center md:justify-end gap-x-12 gap-y-4">
          <a href="https://linkedin.com/in/shauna-mc-naughton-2229b8261" target="_blank" rel="noreferrer" className="font-mono text-[10px] uppercase tracking-widest text-slate-500 hover:text-white transition-colors">LinkedIn</a>
          <a href="mailto:shaunamc77@hotmail.com" className="font-mono text-[10px] uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Email</a>
          <a href="tel:0861280725" className="font-mono text-[10px] uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Call</a>
        </div>
      </footer>

      {/* Interactive Voice Experience */}
      <VoiceAgent />

      {/* Floating WhatsApp Button */}
      <motion.a
        href="https://wa.me/353861280725"
        target="_blank"
        rel="noreferrer"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        className="fixed bottom-32 right-10 z-[60] bg-[#25D366] text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:bg-[#128C7E] transition-colors"
      >
        <MessageCircle size={28} />
      </motion.a>
    </div>
  );
}
