import { motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

export function Scene4() {
  return (
    <motion.section
      className="film-scene"
      style={{ background: '#17393b', color: '#f2f1e9' }}
      initial={{ opacity: 0, scale: 1.12, clipPath: 'circle(24% at 77% 50%)', filter: 'blur(9px)' }}
      animate={{ opacity: 1, scale: 1, clipPath: 'circle(145% at 77% 50%)', filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.08, clipPath: 'circle(23% at 77% 50%)', filter: 'blur(7px)' }}
      transition={{ duration: 0.62, ease: EASE }}
    >
      <motion.div
        className="absolute inset-y-0 left-0 w-1/2 bg-[#203f41]"
        initial={{ x: '-5%' }}
        animate={{ x: 0 }}
        exit={{ x: '-12%', opacity: 0 }}
        transition={{ duration: 0.52, ease: EASE }}
      />
      <motion.div
        className="absolute inset-y-0 right-0 w-1/2 bg-[#e7eee5]"
        initial={{ x: '7%', clipPath: 'polygon(9% 0,100% 0,100% 100%,0 100%)' }}
        animate={{ x: 0, clipPath: 'polygon(4% 0,100% 0,100% 100%,0 100%)' }}
        exit={{ x: '12%', opacity: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      />

      <div className="absolute left-[7%] top-[12%] eyebrow text-[#a7d6bf]">REQUESTER</div>
      <motion.div
        className="absolute left-[7%] top-[21%] display text-[5.2vmin] font-medium tracking-[-.06em]"
        initial={{ opacity: 0, x: -22 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.28, duration: 0.42, ease: EASE }}
      >
        Ari Tan
      </motion.div>
      <motion.div
        className="absolute left-[7%] top-[36%] text-[2vmin] text-white/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.35 }}
      >
        Submitted · TRV-014
      </motion.div>

      <div className="absolute right-[6.5%] top-[12%] eyebrow text-[#59756b]">INDEPENDENT MANAGER</div>
      <motion.div
        className="absolute right-[6.5%] top-[21%] display text-[5.2vmin] font-medium tracking-[-.06em] text-[#173638]"
        initial={{ opacity: 0, x: 22 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.42, ease: EASE }}
      >
        Mina Lee
      </motion.div>
      <motion.div
        className="absolute right-[6.5%] top-[36%] text-[2vmin] text-[#55716b]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.35 }}
      >
        Review recorded
      </motion.div>

      <motion.div
        className="absolute left-[21%] top-[46%] w-[58%] h-[26%] rounded-[1.7vmin] bg-[#f6f3e9] text-[#173638] shadow-[0_2vmin_6vmin_rgba(0,0,0,.18)] px-[2.4vmin] py-[2.1vmin]"
        initial={{ scale: 0.78, y: 22, rotate: -2, opacity: 0 }}
        animate={{ scale: 1, y: 0, rotate: 0, opacity: 1 }}
        transition={{ delay: 0.68, duration: 0.7, ease: EASE }}
      >
        <div className="eyebrow text-[#85918a]">TRV-014 · DEMO CLIENT REVIEW</div>
        <motion.p
          className="text-[2.75vmin] font-medium leading-tight mt-[1.4vmin] mb-0"
          initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
          animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
          transition={{ delay: 1.55, duration: 0.7, ease: EASE }}
        >
          “Reviewed for demo travel.”
        </motion.p>
        <motion.div
          className="absolute left-[2.4vmin] right-[2.4vmin] bottom-[2vmin] h-px bg-[#8eb69d] origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 2.22, duration: 0.65, ease: EASE }}
        />
      </motion.div>

      <motion.div
        className="absolute left-[67%] top-[43%] w-[13vmin] h-[13vmin] rounded-full border-[.45vmin] border-[#6fae8d] bg-[#d8e9dc] text-[#285441] flex items-center justify-center rotate-[-11deg]"
        layoutId="approval-history-node"
        initial={{ scale: 1.75, rotate: 22, opacity: 0 }}
        animate={{ scale: [1.75, 0.9, 1], rotate: -11, opacity: 1 }}
        transition={{ delay: 2.66, duration: 0.65, ease: EASE }}
      >
        <span className="mono text-[1.45vmin] text-center leading-tight font-bold">APPROVED</span>
      </motion.div>
      <motion.div
        className="absolute left-[7%] bottom-[10%] eyebrow text-white/48"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.55, duration: 0.4 }}
      >
        SYNTHETIC DEMO ONLY · NO BOOKING IS SHOWN
      </motion.div>

      <motion.svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.2, duration: 0.25 }}
      >
        <motion.path
          d="M 800 642 C 860 690, 1010 690, 1100 590 L 1235 460"
          fill="none"
          stroke="#78b492"
          strokeWidth="2"
          strokeDasharray="520"
          initial={{ strokeDashoffset: 520 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ delay: 3.25, duration: 0.7, ease: EASE }}
        />
        <motion.circle
          cx="1235"
          cy="460"
          r="9"
          fill="#78b492"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 3.85, duration: 0.25, ease: EASE }}
        />
      </motion.svg>
      <motion.div
        className="absolute left-[77.2%] top-[49.5%] w-[3vmin] h-[3vmin] rounded-full border border-[#72b08f] bg-[#e7eee5]"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.5, 1] }}
        transition={{ delay: 4.05, duration: 0.4, ease: EASE }}
      />
    </motion.section>
  );
}

export default Scene4;
