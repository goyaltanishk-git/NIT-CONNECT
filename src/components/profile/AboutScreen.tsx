import { ArrowUpRight, Heart, Briefcase, ShieldCheck, CheckCircle2, Newspaper, MessageSquare } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import LogoImage from "../../styles/nitlogo.png";

interface AboutScreenProps {
  onBack: () => void;
}

export function AboutScreen({ onBack }: AboutScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  
  // Parallax effect for the hero section
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el && scrollRef.current) {
      // Smoothly scroll the container explicitly
      scrollRef.current.scrollTo({
        top: el.offsetTop - 80, // Adjust for navbar height
        behavior: 'smooth'
      });
    }
  };

  // Reusable smooth transition for boxes
  const smoothTransition = { duration: 0.8, ease: [0.16, 1, 0.3, 1] };

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto scroll-smooth bg-black text-white selection:bg-[#ff1453] selection:text-white relative"
         style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700,1&display=swap');
        
        .font-clash {
          font-family: 'Clash Display', sans-serif;
        }
        
        /* Noise overlay for brutalist texture */
        .bg-noise {
          position: relative;
        }
        .bg-noise::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.04;
          pointer-events: none;
          z-index: 10;
        }

        .marquee-container {
          overflow: hidden;
          white-space: nowrap;
        }
        .marquee-content {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        .bento-card {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bento-card:hover {
          transform: translateY(-6px);
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-white/10 w-full">
        <div className="flex items-center w-1/4">
          <img src={LogoImage} alt="Logo" className="w-12 h-12 object-contain mix-blend-screen" style={{ mixBlendMode: 'screen' }} />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 font-clash text-sm md:text-xl font-bold tracking-widest uppercase text-white flex-1">
          <button onClick={() => scrollTo('home')} className="hover:text-[#ff1453] transition-colors">Home</button>
          <button onClick={() => scrollTo('features')} className="hover:text-[#ff1453] transition-colors">Features</button>
          <button onClick={() => scrollTo('pricing')} className="hover:text-[#ff1453] transition-colors">Pricing</button>
          <button onClick={onBack} className="bg-[#ff1453] hover:bg-[#ff2a63] text-white px-6 md:px-8 py-2 md:py-3 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(255,20,83,0.3)] hover:shadow-[0_0_30px_rgba(255,20,83,0.5)]">
            Get Started
          </button>
        </div>
        <div className="w-1/4 hidden md:block"></div>
      </nav>

      <div className="max-w-[1400px] mx-auto p-4 md:p-8">
        
        {/* TOP LEVEL TITLE AND CTA */}
        <div id="home" className="pt-20 pb-24 relative flex flex-col items-center text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#ff1453] rounded-full blur-[200px] opacity-[0.15] pointer-events-none"></div>
          
          {/* Animated Parallax Wrapper */}
          <motion.div 
            style={{ y: heroY, opacity: heroOpacity }}
            className="flex flex-col items-center relative z-10"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...smoothTransition, delay: 0.1 }}
              className="font-clash text-7xl md:text-[10rem] font-bold leading-[0.85] tracking-tight relative z-10"
            >
              NIT<br />
              <span className="text-[#ff1453]">CONNECT.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...smoothTransition, delay: 0.2 }}
              className="text-xl md:text-3xl text-white/60 font-medium max-w-4xl mt-12 leading-relaxed relative z-10"
            >
              The only ecosystem you need. Job Search, NIT News, Dating, and Communities—built exclusively for verified students.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...smoothTransition, delay: 0.3 }}
              className="mt-12 relative z-20"
            >
              <button onClick={onBack} className="bg-[#ff1453] hover:bg-[#ff2a63] text-white px-10 py-5 rounded-full font-bold text-xl md:text-2xl transition-all shadow-[0_0_30px_rgba(255,20,83,0.3)] hover:shadow-[0_0_50px_rgba(255,20,83,0.5)] flex items-center gap-3 uppercase tracking-widest hover:-translate-y-1 cursor-pointer">
                Get Started
                <ArrowUpRight className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* BENTO GRID OF 4 FEATURES */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-12 auto-rows-[auto] md:auto-rows-[360px] gap-4 md:gap-6 pt-12 overflow-hidden">
          
          {/* BOX 1: DATING BLOCK (Comes smoothly from bottom-left) */}
          <motion.div 
            initial={{ opacity: 0, x: -40, y: 40 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={smoothTransition}
            className="md:col-span-5 bg-[#ff1453] rounded-[2.5rem] p-8 md:p-10 text-black relative overflow-hidden bento-card flex flex-col justify-between bg-noise h-[340px] md:h-auto"
          >
            <Heart className="absolute -right-8 -top-8 w-64 h-64 text-black opacity-10" strokeWidth={1} />
            <div className="relative z-10">
              <h2 className="font-clash text-4xl md:text-5xl font-bold leading-none mb-4 uppercase">Verified<br/>Dating.</h2>
              <p className="text-black/80 font-medium text-lg leading-snug max-w-[250px]">
                Zero fake profiles. Match exclusively with actual verified students from your campus.
              </p>
            </div>
            
            <div className="relative z-10 mt-8 flex -space-x-4">
               <div className="w-16 h-16 rounded-full border-4 border-[#ff1453] bg-black/20 overflow-hidden flex items-center justify-center">
                 <span className="text-xs font-bold uppercase">Rahul</span>
               </div>
               <div className="w-16 h-16 rounded-full border-4 border-[#ff1453] bg-black/40 overflow-hidden flex items-center justify-center">
                 <span className="text-xs font-bold uppercase text-white">Priya</span>
               </div>
               <div className="w-16 h-16 rounded-full border-4 border-[#ff1453] bg-white flex items-center justify-center">
                 <Heart className="w-6 h-6 text-[#ff1453] fill-[#ff1453]" />
               </div>
            </div>
          </motion.div>

          {/* BOX 2: JOBS BLOCK (Comes smoothly from bottom-right) */}
          <motion.div 
            initial={{ opacity: 0, x: 40, y: 40 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ ...smoothTransition, delay: 0.1 }}
            className="md:col-span-7 bg-[#111] rounded-[2.5rem] p-8 md:p-10 border border-white/10 relative overflow-hidden bento-card flex flex-col justify-between bg-noise h-[340px] md:h-auto"
          >
            <Briefcase className="absolute right-0 bottom-0 w-64 h-64 text-white opacity-[0.03] translate-x-1/4 translate-y-1/4" strokeWidth={1} />
            
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <h2 className="font-clash text-4xl md:text-5xl font-bold leading-none mb-4 uppercase">Job<br/>Search.</h2>
                <p className="text-white/60 text-lg leading-snug max-w-sm">
                  New jobs added daily. Access a direct pipeline to all top engineering and tech companies through our exclusive alumni network.
                </p>
              </div>
              <div className="hidden md:flex w-16 h-16 rounded-full bg-white/5 border border-white/10 items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-[#ff1453]" />
              </div>
            </div>

            <div className="relative z-10 mt-8 w-full bg-white/5 border border-white/10 rounded-2xl p-4 overflow-hidden">
              <div className="marquee-container">
                <div className="marquee-content flex gap-8 items-center font-clash text-xl md:text-2xl font-bold text-white/30 tracking-wider">
                  <span>CORE ENGINEERING</span> <span className="text-[#ff1453]">•</span>
                  <span>SDE INTERN</span> <span className="text-[#ff1453]">•</span>
                  <span>MECHANICAL</span> <span className="text-[#ff1453]">•</span>
                  <span>CIVIL</span> <span className="text-[#ff1453]">•</span>
                  <span>DATA SCIENTIST</span> <span className="text-[#ff1453]">•</span>
                  <span>AEROSPACE</span> <span className="text-[#ff1453]">•</span>
                  {/* Duplicated for smooth scrolling */}
                  <span>CORE ENGINEERING</span> <span className="text-[#ff1453]">•</span>
                  <span>SDE INTERN</span> <span className="text-[#ff1453]">•</span>
                  <span>MECHANICAL</span> <span className="text-[#ff1453]">•</span>
                  <span>CIVIL</span> <span className="text-[#ff1453]">•</span>
                  <span>DATA SCIENTIST</span> <span className="text-[#ff1453]">•</span>
                  <span>AEROSPACE</span> <span className="text-[#ff1453]">•</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* BOX 3: COMMUNITIES / NIT DISCORD (Comes smoothly from bottom-left) */}
          <motion.div 
            initial={{ opacity: 0, x: -40, y: 40 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={smoothTransition}
            className="md:col-span-6 bg-[#1a1a1a] rounded-[2.5rem] p-8 md:p-10 border border-white/10 relative overflow-hidden bento-card flex flex-col justify-between bg-noise"
          >
            <MessageSquare className="absolute right-0 bottom-0 w-64 h-64 text-white opacity-[0.02] translate-x-1/4 translate-y-1/4" />
            <div className="relative z-10">
              <div className="flex gap-2 mb-6">
                <span className="px-3 py-1 bg-[#ff1453]/20 text-[#ff1453] rounded-full text-xs font-bold uppercase tracking-widest">NIT Discord</span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-white">Societies</span>
              </div>
              <h2 className="font-clash text-4xl md:text-5xl font-bold leading-none mb-4 uppercase">The NIT<br/>Discord.</h2>
              <p className="text-white/60 text-lg leading-snug">
                Filter out WhatsApp spam. Join hyper-specific clubs from AI/ML to Debate, and talk with your tribe in E2E encrypted channels.
              </p>
            </div>
            
            <div className="w-full flex flex-col gap-3 relative z-10 mt-8">
              <div className="w-full p-4 bg-white/5 border border-white/10 rounded-t-2xl rounded-bl-2xl rounded-br-sm flex items-start gap-3">
                 <div className="w-8 h-8 rounded-full bg-[#ff1453] flex-shrink-0 flex items-center justify-center">
                   <MessageSquare className="w-4 h-4 text-black" />
                 </div>
                 <div>
                   <div className="text-xs font-bold text-white/50 mb-1">Robotics Club</div>
                   <div className="text-sm font-medium">Anyone bringing the Arduino kit today?</div>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* BOX 4: NIT NEWS (Comes smoothly from bottom-right) */}
          <motion.div 
            initial={{ opacity: 0, x: 40, y: 40 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ ...smoothTransition, delay: 0.1 }}
            className="md:col-span-6 bg-[#111] rounded-[2.5rem] p-8 md:p-10 border border-white/10 relative overflow-hidden bento-card flex flex-col justify-between bg-noise"
          >
            <Newspaper className="absolute right-0 bottom-0 w-64 h-64 text-white opacity-[0.03] translate-x-1/4 translate-y-1/4" />
            
            <div className="relative z-10">
              <div className="flex gap-2 mb-6">
                <span className="px-3 py-1 bg-[#ff1453] text-black rounded-full text-xs font-bold uppercase tracking-widest animate-pulse">Live Updates</span>
              </div>
              <h2 className="font-clash text-4xl md:text-5xl font-bold leading-none mb-4 uppercase">NIT<br/>News.</h2>
              <p className="text-white/60 text-lg leading-snug max-w-sm">
                Get the latest NIT news, official admin announcements, and hackathon schedules instantly. No noise, just the signal.
              </p>
            </div>

            <div className="w-full flex flex-col gap-3 relative z-10 mt-8">
              <div className="w-full p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
                 <div>
                   <div className="text-xs font-bold text-[#ff1453] mb-1">Campus Admin • Just Now</div>
                   <div className="text-sm font-medium">TechFest early-bird registrations are now open for all verified students.</div>
                 </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* SECURITY SECTION (Outside of grid, text-only downward) */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={smoothTransition}
          className="py-24 text-center flex flex-col items-center max-w-3xl mx-auto"
        >
          <ShieldCheck className="w-16 h-16 text-[#ff1453] mb-8" />
          <h2 className="font-clash text-5xl md:text-6xl font-bold leading-none mb-6 uppercase tracking-tight">Fort Knox Security.</h2>
          <p className="text-xl text-white/60 font-medium">
            100% Student Verified. Entry strictly requires a valid <code className="text-[#ff1453] bg-[#ff1453]/10 px-2 rounded">.edu</code> email. Outsiders, fakes, and bots physically cannot join the network.
          </p>
        </motion.div>

        {/* PRICING SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={smoothTransition}
          id="pricing" 
          className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12"
        >
          
          {/* Free */}
          <div className="bg-[#111] rounded-[2.5rem] p-8 md:p-12 border border-white/10 bg-noise flex flex-col justify-between bento-card">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Basic</div>
              <div className="font-clash text-5xl font-bold mb-4">FREE</div>
              <p className="text-white/60 mb-8 text-lg">Everything you need to survive your campus life.</p>
              
              <ul className="space-y-4 text-white/80 font-medium">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-white/20"/> 10 Dating Swipes per day</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-white/20"/> Join all public societies & clubs</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-white/20"/> Access to the Job Board</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-white/20"/> Basic E2E Encrypted Chat</li>
              </ul>
            </div>
            <button onClick={onBack} className="mt-12 w-full py-4 rounded-full border border-white/20 hover:bg-white/10 font-bold transition-colors">
              Current Plan
            </button>
          </div>

          {/* Premium */}
          <div className="bg-[#ff1453] text-black rounded-[2.5rem] p-8 md:p-12 border border-[#ff1453] bg-noise flex flex-col justify-between bento-card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs font-bold uppercase tracking-widest text-black/60">Premium</div>
                <div className="px-3 py-1 bg-black text-[#ff1453] text-[10px] font-bold uppercase tracking-widest rounded-full animate-pulse shadow-lg">Coming Soon</div>
              </div>
              <div className="font-clash text-5xl font-bold mb-4">PRO</div>
              <p className="text-black/80 mb-8 text-lg font-medium">The ultimate unfair advantage for your NIT life.</p>
              
              <ul className="space-y-4 text-black/90 font-bold">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-black/40"/> Unlimited Swipes & priority matching</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-black/40"/> Incognito Mode for Dating</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-black/40"/> Priority Alumni Job Referrals</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-black/40"/> Verified PRO Badge</li>
              </ul>
            </div>
            <button onClick={onBack} className="mt-12 w-full py-4 rounded-full bg-black text-white hover:bg-black/80 font-bold transition-colors shadow-2xl relative z-10">
              Join the Waitlist
            </button>
          </div>
          
        </motion.div>

        {/* FINAL CTA BUTTON */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={smoothTransition}
          className="flex justify-center py-16"
        >
          <button onClick={onBack} className="bg-[#ff1453] hover:bg-[#ff2a63] text-white px-16 py-6 rounded-full font-clash text-3xl font-bold transition-all shadow-[0_0_40px_rgba(255,20,83,0.4)] hover:shadow-[0_0_60px_rgba(255,20,83,0.6)] hover:-translate-y-2 flex items-center gap-4 uppercase tracking-wider">
            Go To App
            <ArrowUpRight className="w-8 h-8" />
          </button>
        </motion.div>

      </div>

      {/* FOOTER */}
      <footer className="py-8 px-8 border-t border-white/10 bg-black">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img src={LogoImage} alt="Logo" className="w-6 h-6 object-cover rounded opacity-80" style={{ mixBlendMode: 'screen' }} />
            <span className="font-clash font-bold text-sm tracking-widest text-white/50">NIT CONNECT © 2026</span>
          </div>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-white/30">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="mailto:nitconnectofficial@gmail.com" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}