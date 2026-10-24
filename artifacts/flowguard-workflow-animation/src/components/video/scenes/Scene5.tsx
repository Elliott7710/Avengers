import { motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

export function Scene5() {
  return (
    <motion.section
      className="film-scene"
      style={{ background: '#15383a', color: '#f2f1e9' }}
      initial={{ opacity: 0, clipPath: 'inset(0 0 0 100%)', scale: 1.035 }}
      animate={{ opacity: 1, clipPath: 'inset(0)', scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, clipPath: 'inset(0 100% 0 0)' }}
      transition={{ duration: 0.58, ease: EASE }}
    >
      <div className="absolute left-[7%] top-[10%] eyebrow text-[#a7d6bf]">05 / THE OUTCOME</div>
      <motion.div
        className="absolute left-[8%] top-[21%] w-[56%] h-[62%] rounded-[2vmin] bg-[#f2f1e9] text-[#173638] p-[4vmin] shadow-[0_2vmin_8vmin_rgba(0,0,0,.24)]"
        initial={{ opacity: 0, y: 28, rotate: -2.5, scale: 0.93 }}
        animate={{ opacity: 1, y: 0, rotate: -1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.8, ease: EASE }}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="eyebrow text-[#7a8b82]">TRAVEL REQUEST · TRV-014</div>
            <div className="display text-[5.4vmin] leading-none font-semibold tracking-[-.06em] mt-[1.8vmin]">Demo City</div>
            <p className="text-[2.15vmin] text-[#718078] mt-[1.3vmin]">Ari Tan · 02–04 Nov 2026</p>
          </div>
          <span className="rounded-full px-[1.5vmin] py-[.8vmin] bg-[#dce9dc] text-[#416b50] mono text-[1.65vmin]">APPROVED</span>
        </div>
        <div className="absolute left-[4vmin] right-[4vmin] bottom-[17%] border-t border-[#173638]/15 pt-[2vmin]">
          <div className="eyebrow text-[#84918b]">MANAGER’S NOTE</div>
          <p className="text-[2.7vmin] leading-tight font-medium mt-[.8vmin]">“Reviewed for demo travel.”</p>
        </div>
        <div className="absolute bottom-[5%] left-[4vmin] eyebrow text-[#8b958e]">SYNTHETIC DEMO · NO BOOKING IS SHOWN</div>
      </motion.div>

      <div className="absolute right-[8%] top-[26%] w-[24%]">
        <motion.div
          className="display text-[5.4vmin] leading-[1.08] font-semibold tracking-[-.055em]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.75, duration: 0.55, ease: EASE }}
        >
          A human<br />decision,<br /><span className="text-[#a7d6bf]">recorded.</span>
        </motion.div>
        <motion.div
          className="mt-[3vmin] border-l border-[#e5b45f] pl-[1.5vmin] text-[2vmin] leading-[1.35] text-white/65"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.45, duration: 0.45 }}
        >
          The employee can see the manager’s note and updated status here.
        </motion.div>
      </div>
      <div className="absolute bottom-[7%] right-[7%] eyebrow text-white/35">PROTOTYPE FLOW · ILLUSTRATIVE DATA</div>
    </motion.section>
  );
}

export default Scene5;
