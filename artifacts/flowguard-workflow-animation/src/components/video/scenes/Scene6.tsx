import { motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;
const HISTORY = [
  { index: '01', title: 'Submitted', by: 'Employee · Ari Tan', time: '10:42', tone: '#6eaa8a' },
  { index: '02', title: 'Approved', by: 'Manager · Mina Lee', time: '10:47', tone: '#6eaa8a' },
  { index: '03', title: 'Reason recorded', by: 'Reviewed for demo travel.', time: '10:47', tone: '#d2a454' },
];

export function Scene6() {
  return (
    <motion.section
      className="film-scene"
      style={{ background: '#e9eee5', color: '#173638' }}
      initial={{ opacity: 0, clipPath: 'circle(16% at 50% 55%)', scale: 1.08 }}
      animate={{ opacity: 1, clipPath: 'circle(145% at 50% 55%)', scale: 1 }}
      exit={{ opacity: 0, clipPath: 'circle(20% at 50% 55%)', scale: 1.06 }}
      transition={{ duration: 0.65, ease: EASE }}
    >
      <div className="absolute left-[8%] top-[10%] eyebrow text-[#678173]">06 / THE ACTIVITY HISTORY</div>
      <div className="absolute left-[8%] top-[23%] w-[84%]">
        <div className="flex items-end justify-between border-b border-[#173638]/20 pb-[2.2vmin]">
          <div>
            <p className="eyebrow text-[#809087] mb-[1vmin]">REQUEST RECORD</p>
            <h2 className="display text-[7.3vmin] leading-none tracking-[-.065em] font-semibold m-0">TRV-014</h2>
          </div>
          <span className="mono text-[1.75vmin] text-[#738078]">SUBMITTED → REVIEWED → RECORDED</span>
        </div>

        <div className="relative mt-[3vmin]">
          <motion.div
            className="absolute left-[2.45vmin] top-[2vmin] bottom-[2vmin] w-px bg-[#72a98a]"
            initial={{ scaleY: 0, transformOrigin: 'top' }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.45, duration: 1.05, ease: EASE }}
          />
          {HISTORY.map((event, index) => (
            <motion.div
              key={event.index}
              className="relative grid grid-cols-[5vmin_1fr_auto] items-center gap-[2vmin] py-[2.1vmin] border-b border-[#173638]/12"
              initial={{ opacity: 0, x: 24, clipPath: 'inset(0 0 0 100%)' }}
              animate={{ opacity: 1, x: 0, clipPath: 'inset(0)' }}
              transition={{ delay: 0.35 + index * 0.36, duration: 0.52, ease: EASE }}
            >
              <span
                className="relative z-10 flex h-[4.8vmin] w-[4.8vmin] items-center justify-center rounded-full border-[.35vmin] border-[#e9eee5] mono text-[1.35vmin] text-[#f6f3e9]"
                style={{ backgroundColor: event.tone }}
              >
                {event.index}
              </span>
              <span>
                <strong className="display block text-[3.35vmin] leading-none font-semibold">{event.title}</strong>
                <span className="block mt-[.9vmin] text-[1.9vmin] text-[#738078]">{event.by}</span>
              </span>
              <span className="mono text-[1.65vmin] text-[#859188]">{event.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
      <motion.div
        className="absolute bottom-[9%] right-[8%] max-w-[42%] border-l-[.35vmin] border-[#d2a454] pl-[1.6vmin] text-[2vmin] leading-[1.35] text-[#69776f]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.65, duration: 0.45 }}
      >
        A visible record of the request and the manager’s decision.
      </motion.div>
      <div className="absolute bottom-[9%] left-[8%] eyebrow text-[#87928a]">SYNTHETIC DEMO · NO BOOKING OR PURCHASE</div>
    </motion.section>
  );
}

export default Scene6;
