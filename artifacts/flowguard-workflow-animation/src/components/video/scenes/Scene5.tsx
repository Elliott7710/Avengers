import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';

const EASE = [0.22, 1, 0.36, 1] as const;
const STEPS = ['SUBMIT.', 'FLAG.', 'MANAGER.', 'HISTORY.'];

export function Scene5() {
  const [recap, setRecap] = useState(0);
  useSceneTimer([
    { time: 2520, callback: () => setRecap(1) },
    { time: 2780, callback: () => setRecap(2) },
    { time: 3040, callback: () => setRecap(3) },
    { time: 3300, callback: () => setRecap(4) },
  ]);

  return (
    <motion.section
      className="film-scene"
      style={{ background: '#17393b', color: '#f2f1e9' }}
      initial={{ opacity: 0, clipPath: 'circle(22% at 77% 50%)' }}
      animate={{ opacity: 1, clipPath: 'circle(145% at 77% 50%)' }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.62, ease: EASE }}
    >
      <motion.div
        className="absolute left-[9%] top-[12%] w-[62%] h-[76%] rounded-[1.7vmin] bg-[#f2f1e9] text-[#173638] shadow-[0_2vmin_7vmin_rgba(3,22,24,.24)] p-[3vmin]"
        initial={{ scale: 1.18, y: 15, rotate: 2, opacity: 0 }}
        animate={{ scale: 1, y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.75, delay: 0.1, ease: EASE }}
      >
        <div className="eyebrow text-[#778780]">ACTIVITY HISTORY</div>
        <div className="display text-[4.5vmin] tracking-[-.055em] font-semibold mt-[.65vmin]">TRV-014</div>
        <div className="absolute left-[3.3vmin] top-[33%] bottom-[14%] w-px bg-[#86b99d]" />
        {[
          { title: 'Submitted', actor: 'Employee · Ari Tan', time: '10:42' },
          { title: 'Approved', actor: 'Manager · Mina Lee', time: '10:47' },
          { title: 'Reason recorded', actor: 'Reviewed for demo travel.', time: '10:47' },
        ].map((event, index) => (
          <motion.div
            key={event.title}
            className="absolute left-[3vmin] right-[3vmin] flex items-center gap-[1.8vmin]"
            style={{ top: `${35 + index * 19}%` }}
            initial={{ opacity: 0, x: 22, clipPath: 'inset(0 0 0 100%)' }}
            animate={{ opacity: 1, x: 0, clipPath: 'inset(0 0 0 0%)' }}
            transition={{ delay: 0.42 + index * 0.37, duration: 0.48, ease: EASE }}
          >
            <motion.span
              layoutId={index === 1 ? 'approval-history-node' : undefined}
              className={`relative z-10 w-[1.5vmin] h-[1.5vmin] shrink-0 rounded-full border-[.3vmin] border-[#f2f1e9] ${index === 1 ? 'bg-[#69a984]' : 'bg-[#17393b]'}`}
              transition={{ duration: 0.42, ease: EASE }}
            />
            <span className="flex-1 flex items-baseline justify-between border-b border-[#173638]/12 pb-[1.2vmin]">
              <span>
                <strong className="display block text-[2.7vmin] leading-none font-semibold">{event.title}</strong>
                <span className="block text-[1.65vmin] text-[#74827b] mt-[.75vmin]">{event.actor}</span>
              </span>
              <span className="mono text-[1.45vmin] text-[#87938d]">{event.time}</span>
            </span>
          </motion.div>
        ))}
        <motion.span
          className="absolute right-[3vmin] top-[10%] rounded-full px-[1.35vmin] py-[.7vmin] bg-[#dce9dc] text-[#416b50] mono text-[1.55vmin]"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.15, duration: 0.38, ease: EASE }}
        >
          APPROVED
        </motion.span>
        <motion.div
          className="absolute bottom-[4.2%] left-[3vmin] text-[1.45vmin] text-[#87938d]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.4 }}
        >
          PROTOTYPE FLOW · SYNTHETIC DATA · NO REAL BOOKING
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute right-[7%] top-[18%] w-[25%] h-[62%] flex flex-col items-start justify-center"
        initial={{ opacity: 0, x: 28 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.45, duration: 0.55, ease: EASE }}
      >
        <p className="eyebrow text-[#a7d6bf] mb-[1.7vmin]">YOUR RECORDING CUE</p>
        <div className="relative w-full h-[13vmin] flex items-center">
          <AnimatePresence mode="sync">
            {recap < 4 ? (
              <motion.span
                key={STEPS[recap]}
                className="absolute display text-[7.2vmin] leading-none font-semibold tracking-[-.07em]"
                initial={{ opacity: 0, scale: 1.2, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.76, filter: 'blur(4px)', transition: { duration: 0.12 } }}
                transition={{ duration: 0.24, ease: EASE }}
              >
                {STEPS[recap]}
              </motion.span>
            ) : (
              <motion.div
                className="absolute flex flex-col gap-[.4vmin] display text-[3.1vmin] leading-[1.05] font-semibold tracking-[-.045em]"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <span>SUBMIT <b className="text-[#a7d6bf]">/</b> FLAG</span>
                <span>MANAGER <b className="text-[#a7d6bf]">/</b> HISTORY</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <motion.div
          className="w-full h-px bg-[#a7d6bf]/65 origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 2.55, duration: 0.7, ease: EASE }}
        />
        <motion.p
          className="text-[2vmin] leading-[1.4] text-white/60 mt-[1.5vmin] max-w-[28ch]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.1, duration: 0.4, ease: EASE }}
        >
          Use synthetic details. Show each handoff.
        </motion.p>
      </motion.div>

      <motion.div
        className="absolute inset-0 z-10 bg-[#f1f0e7] text-[#173638] flex items-center justify-center"
        initial={{ clipPath: 'inset(0 0 0 100%)' }}
        animate={{ clipPath: ['inset(0 0 0 100%)', 'inset(0 0 0 0%)'] }}
        transition={{ delay: 3.52, duration: 0.38, ease: EASE }}
      >
        <motion.div
          className="absolute left-[12%] top-[18%] eyebrow text-[#6b8177]"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 3.83, duration: 0.3 }}
        >
          THE WORKFLOW IS THE STORY
        </motion.div>
        <motion.div
          className="absolute left-[12%] top-[32%] display text-[8.4vmin] leading-[.98] tracking-[-.07em] font-semibold"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.91, duration: 0.48, ease: EASE }}
        >
          <span className="block">FlowGuard</span>
          <span className="block text-[#608675] text-[5vmin] font-medium mt-[1.3vmin]">Your turn: show each handoff.</span>
        </motion.div>
        <motion.div
          className="absolute right-[15%] top-[31%] w-[17vmin] h-[17vmin] rounded-full border-[.55vmin] border-[#7bb495] flex items-center justify-center"
          initial={{ scale: 0.52, rotate: -32, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ delay: 4.02, duration: 0.65, ease: EASE }}
        >
          <span className="mono text-[1.8vmin] text-[#47745e]">FG</span>
          <motion.span
            className="absolute -right-[.7vmin] top-[22%] w-[1.5vmin] h-[1.5vmin] rounded-full bg-[#d2a454]"
            animate={{ scale: [1, 1.22, 1] }}
            transition={{ delay: 4.15, duration: 0.9, repeat: Infinity }}
          />
        </motion.div>
        <motion.div
          className="absolute right-[15%] top-[31%] w-[17vmin] h-[17vmin] rounded-full border border-[#78a98e]"
          initial={{ scale: 0.82, opacity: 0 }}
          animate={{ scale: [0.82, 12], opacity: [0, 0.72, 0] }}
          transition={{ delay: 4.95, duration: 0.54, times: [0, 0.32, 1], ease: EASE }}
        />
        <motion.div
          className="absolute bottom-[7%] right-[7%] eyebrow text-[#85948b]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.15, duration: 0.25 }}
        >
          SYNTHETIC DEMO · 24 SEC
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

export default Scene5;
