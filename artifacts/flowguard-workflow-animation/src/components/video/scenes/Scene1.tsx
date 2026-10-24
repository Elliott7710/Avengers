import { motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

export function Scene1() {
  return (
    <motion.section
      className="film-scene"
      style={{ background: '#15383a', color: '#f1f1e7' }}
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 2.65, filter: 'blur(13px)', clipPath: 'inset(1% 4% 1% 24%)' }}
      transition={{ duration: 0.42, ease: EASE }}
    >
      <div className="absolute inset-y-0 left-0 w-[51%] flex flex-col justify-center pl-[7%] z-10">
        <motion.p
          className="eyebrow text-[#a7d6bf] mb-[3.1vmin]"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.38, delay: 0.12 }}
        >
          FLOWGUARD / TRAVEL
        </motion.p>
        <div className="relative overflow-hidden">
          <motion.h1
            className="display text-[8vmin] leading-[.98] font-semibold m-0"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.42, delay: 0.2, ease: EASE, type: 'spring', stiffness: 280, damping: 25 }}
          >
            A request.
          </motion.h1>
        </div>
        <div className="relative overflow-hidden mt-[.55vmin]">
          <motion.p
            className="display text-[8vmin] leading-[.98] font-semibold m-0 text-[#a7d6bf]"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.42, delay: 0.69, ease: EASE, type: 'spring', stiffness: 280, damping: 25 }}
          >
            Two people.
          </motion.p>
        </div>
        <div className="relative overflow-hidden mt-[.65vmin]">
          <motion.p
            className="display text-[6.1vmin] leading-[1.02] font-medium m-0 text-[#f1f1e7]/75"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.44, delay: 1.18, ease: EASE, type: 'spring', stiffness: 280, damping: 25 }}
          >
            One clear record.
          </motion.p>
        </div>
        <motion.div
          className="mt-[4vmin] flex items-center gap-[1.2vmin] text-[1.85vmin] text-[#e6ece2]/65"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.45 }}
        >
          <span className="w-[.7vmin] h-[.7vmin] rounded-full bg-[#a7d6bf]" />
          Request → independent review → history
        </motion.div>
      </div>

      <div className="absolute inset-y-0 right-0 w-[49%] perspective-[1200px]">
        <motion.div
          className="absolute right-[8%] top-[20%] w-[70%] h-[62%] rounded-[2.1vmin] border border-white/10 bg-[#21494a]/80"
          initial={{ x: 105, rotate: 8, opacity: 0 }}
          animate={{ x: 0, rotate: 4, opacity: 1 }}
          transition={{ duration: 0.78, delay: 0.4, ease: EASE }}
        >
          <div className="absolute inset-x-[9%] top-[11%] flex justify-between items-center">
            <span className="eyebrow text-white/50">MANAGER REVIEW</span>
            <span className="w-[1.3vmin] h-[1.3vmin] rounded-full bg-[#e5b45f]" />
          </div>
          <div className="absolute left-[9%] right-[9%] top-[32%] h-px bg-white/15" />
          <div className="absolute right-[6%] top-[55%] w-[24%] text-right text-white/65 mono text-[1.55vmin] leading-[1.35]">
            WAITING FOR<br />ANOTHER PERSON
          </div>
        </motion.div>

        <motion.div
          className="absolute left-[3%] top-[27%] w-[65%] h-[52%] rounded-[1.7vmin] bg-[#f2f1e9] text-[#173638] shadow-[0_2vmin_7vmin_rgba(0,0,0,.26)]"
          initial={{ x: 125, y: 18, rotateY: -18, rotateZ: -5, opacity: 0, scale: 0.84 }}
          animate={{ x: 0, y: 0, rotateY: 0, rotateZ: -2, opacity: 1, scale: 1 }}
          transition={{ duration: 0.88, delay: 0.54, ease: EASE }}
        >
          <div className="absolute inset-x-[8%] top-[11%] flex justify-between items-center">
            <span className="eyebrow text-[#667b76]">TRAVEL REQUEST</span>
            <span className="mono text-[1.8vmin] text-[#446765]">TRV-014</span>
          </div>
          <div className="absolute left-[8%] top-[32%]">
            <p className="display text-[3.7vmin] font-semibold tracking-[-.05em] m-0">Demo client review</p>
            <p className="text-[2vmin] text-[#758680] mt-[1vmin]">Demo City · 02–04 Nov</p>
          </div>
          <div className="absolute left-[8%] bottom-[12%] rounded-full px-[1.35vmin] py-[.65vmin] bg-[#f3e7c9] text-[#795b2d] mono text-[1.65vmin]">REQUESTED</div>
        </motion.div>
        <motion.div
          className="absolute left-[6%] top-[82%] w-[68%] h-[1px] origin-left bg-[#a7d6bf]"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 1.3, ease: EASE }}
        />
        <motion.span
          className="absolute left-[6%] top-[82%] w-[1.3vmin] h-[1.3vmin] -translate-y-1/2 rounded-full border border-[#a7d6bf] bg-[#15383a]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.35, delay: 1.5, ease: EASE }}
        />
      </div>
    </motion.section>
  );
}

export default Scene1;
