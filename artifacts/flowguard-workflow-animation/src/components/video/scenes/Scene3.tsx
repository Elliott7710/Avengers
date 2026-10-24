import { motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

export function Scene3() {
  return (
    <motion.section
      className="film-scene"
      style={{ background: '#18383a', color: '#f2f1e9' }}
      initial={{ opacity: 0, clipPath: 'polygon(50% 0,50% 0,50% 100%,50% 100%)' }}
      animate={{ opacity: 1, clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)' }}
      exit={{ opacity: 0, x: -24, rotateY: 14, scale: 0.98, clipPath: 'inset(0 0 0 100%)', filter: 'blur(5px)' }}
      transition={{ duration: 0.44, ease: EASE }}
    >
      <motion.div
        className="absolute left-[7%] top-[9%] eyebrow text-[#a7d6bf]"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.35 }}
      >
        ILLUSTRATIVE DEMO RULE
      </motion.div>
      <motion.p
        className="absolute left-[7%] top-[15%] display text-[11vmin] leading-none tracking-[-.07em] font-semibold m-0"
        initial={{ opacity: 0, scale: 0.86, transformOrigin: 'left center' }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, duration: 0.7, ease: EASE }}
      >
        MYR 1,500
      </motion.p>
      <motion.div
        className="absolute left-[8%] right-[8%] top-[51%] h-px threshold-dash"
        initial={{ scaleX: 0, transformOrigin: 'left' }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.7, ease: EASE }}
      />
      <motion.div
        className="absolute left-[59%] top-[42%] bottom-[34%] w-[.55vmin] bg-[#e5b45f] rounded-full"
        initial={{ scaleY: 0, transformOrigin: 'bottom' }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.9, duration: 0.4, ease: EASE }}
      />
      <motion.div
        className="absolute left-[55.5%] top-[43%] rounded-full border border-[#e5b45f]/65 bg-[#433d30] px-[1.1vmin] py-[.65vmin] mono text-[1.7vmin] text-[#f4cf8c]"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.15, duration: 0.38, ease: EASE }}
      >
        MYR 1,000
      </motion.div>
      <motion.div
        className="absolute left-[66%] top-[46%] flex items-center gap-[1.2vmin] mono text-[1.85vmin] text-[#f2ca82]"
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.55, duration: 0.42, ease: EASE }}
      >
        <span className="w-[2.3vmin] h-px bg-[#e5b45f]" />
        HIGH_BUDGET
      </motion.div>

      <motion.div
        className="absolute left-[8%] top-[65%] w-[73%] flex items-center gap-[1.4vmin]"
        initial={{ scaleX: 0, transformOrigin: 'left' }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.75, duration: 0.6, ease: EASE }}
      >
        <span className="w-[1.15vmin] h-[1.15vmin] rounded-full bg-[#a7d6bf] shadow-[0_0_0_0.6vmin_rgba(167,214,191,.13)]" />
        <div className="h-px flex-1 bg-[#a7d6bf]/55" />
        <span className="rounded-full bg-[#315b4e] border border-[#9ac6aa]/45 px-[1.3vmin] py-[.8vmin] mono text-[1.75vmin] text-[#cde3d2]">REQUESTED</span>
      </motion.div>
      <motion.p
        className="absolute left-[8%] bottom-[12%] display text-[4.2vmin] tracking-[-.045em] font-medium m-0"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.22, duration: 0.5, ease: EASE }}
      >
        A flag is not a decision.
      </motion.p>
      <motion.div
        className="absolute right-[8%] bottom-[12%] w-[33%] border-l border-[#e5b45f] pl-[1.5vmin] text-[2.2vmin] leading-[1.25] text-[#e5e7dd]/75"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2.65, duration: 0.45, ease: EASE }}
      >
        Still requires manager approval
        <span className="block mt-[.7vmin] text-[1.55vmin] text-white/42">Demo threshold only</span>
      </motion.div>
      <motion.div
        className="absolute inset-y-0 left-[59%] w-[41%] bg-[#f0efe5] origin-left"
        initial={{ scaleX: 0, clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)' }}
        animate={{ scaleX: 1, clipPath: 'polygon(6% 0,100% 0,100% 100%,0 100%)' }}
        transition={{ delay: 3.98, duration: 0.42, ease: EASE }}
      />
      <motion.div
        className="absolute right-[6%] top-[7%] eyebrow text-[#647b73]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4.18, duration: 0.2 }}
      >
        HUMAN REVIEW
      </motion.div>
    </motion.section>
  );
}

export default Scene3;
