import { motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

export function Scene7() {
  return (
    <motion.section
      className="film-scene"
      style={{ background: '#f1f0e7', color: '#173638' }}
      initial={{ opacity: 0, clipPath: 'inset(100% 0 0 0)', y: 22 }}
      animate={{ opacity: 1, clipPath: 'inset(0)', y: 0 }}
      exit={{ opacity: 0, scale: 0.97, clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: 0.62, ease: EASE }}
    >
      <motion.div
        className="absolute left-[9%] top-[17%] eyebrow text-[#6d8779]"
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.18, duration: 0.4 }}
      >
        FLOWGUARD / A SHARED WORKSPACE
      </motion.div>
      <motion.div
        className="absolute left-[9%] top-[30%] max-w-[69%] display text-[9.2vmin] leading-[.98] tracking-[-.07em] font-semibold"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36, duration: 0.62, ease: EASE }}
      >
        One request.<br />
        <span className="text-[#608675]">One accountable decision.</span>
      </motion.div>
      <motion.div
        className="absolute left-[9%] top-[64%] text-[3vmin] leading-[1.4] text-[#64766d]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.86, duration: 0.48 }}
      >
        Request · human review · visible history
      </motion.div>
      <motion.div
        className="absolute right-[11%] top-[32%] w-[17vmin] h-[17vmin] rounded-full border-[.55vmin] border-[#77ab8e] flex items-center justify-center"
        initial={{ scale: 0.62, rotate: -22, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ delay: 0.58, duration: 0.72, ease: EASE }}
      >
        <span className="mono text-[2.1vmin] text-[#47745e]">FG</span>
      </motion.div>
      <motion.div
        className="absolute right-[11%] top-[32%] w-[17vmin] h-[17vmin] rounded-full border border-[#77ab8e]/60"
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1.24, opacity: 0.66 }}
        transition={{ delay: 1.1, duration: 0.6, ease: EASE }}
      />
      <motion.div
        className="absolute bottom-[9%] left-[9%] eyebrow text-[#829087]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.35 }}
      >
        SYNTHETIC DEMONSTRATION · THANK YOU
      </motion.div>
    </motion.section>
  );
}

export default Scene7;
