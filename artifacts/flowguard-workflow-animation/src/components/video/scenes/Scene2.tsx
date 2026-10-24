import { motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

function Field({ label, value, className = '', delay = 0 }: { label: string; value: string; className?: string; delay?: number }) {
  return (
    <motion.div
      className={`border-b border-[#173638]/15 pb-[1.2vmin] ${className}`}
      initial={{ opacity: 0, y: 16, clipPath: 'inset(0 0 100% 0)' }}
      animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
      transition={{ duration: 0.52, delay, ease: EASE }}
    >
      <span className="eyebrow block text-[#84918b] text-[1.45vmin] mb-[.65vmin]">{label}</span>
      <span className="text-[2.45vmin] font-medium leading-tight">{value}</span>
    </motion.div>
  );
}

export function Scene2() {
  return (
    <motion.section
      className="film-scene"
      style={{ background: '#17393b', color: '#f2f1e9' }}
      initial={{ opacity: 0, clipPath: 'inset(0 50% 0 50%)' }}
      animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0%)' }}
      exit={{ opacity: 0, x: -34, y: 12, rotateY: -14, rotateZ: -4, scale: 1.045, clipPath: 'polygon(0 0,100% 0,0 100%,0 100%)', filter: 'blur(7px)' }}
      transition={{ duration: 0.46, ease: EASE }}
    >
      <div className="absolute left-[6%] top-[8%] eyebrow text-[#a7d6bf]">01 / EMPLOYEE SUBMITS</div>
      <motion.div
        className="absolute left-[10%] top-[18%] w-[61%] h-[73%] form-paper rounded-[1.5vmin] p-[3.3vmin] origin-bottom-left"
        initial={{ scale: 0.91, rotate: -5, x: 35, y: 20 }}
        animate={{ scale: 1, rotate: -2.2, x: 0, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
      >
        <div className="flex justify-between items-start mb-[2.6vmin]">
          <div>
            <div className="eyebrow text-[#7a8a83]">NEW TRAVEL REQUEST</div>
            <div className="display text-[4.2vmin] font-semibold mt-[.55vmin]">TRV-014</div>
          </div>
          <motion.span
            className="rounded-full px-[1.15vmin] py-[.7vmin] bg-[#f2e6c8] text-[#785c30] mono text-[1.5vmin]"
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 2.42, duration: 0.38, ease: EASE }}
          >
            REQUESTED
          </motion.span>
        </div>
        <div className="grid grid-cols-2 gap-x-[4vmin] gap-y-[2.4vmin]">
          <Field label="Traveller" value="Ari Tan" delay={0.46} />
          <Field label="Destination" value="Demo City" delay={0.7} />
          <Field label="Departure / return" value="02–04 Nov 2026" delay={1.04} className="col-span-2" />
          <Field label="Purpose" value="Demo client review" delay={1.45} className="col-span-2" />
          <motion.div
            className="col-span-2 flex justify-between items-end border-b border-[#173638]/15 pb-[1vmin]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, delay: 1.88, ease: EASE }}
          >
            <span className="eyebrow text-[#84918b] text-[1.45vmin]">ESTIMATED COST</span>
            <motion.span
              className="display text-[4.3vmin] leading-none tracking-[-.05em] font-semibold"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 2.02, duration: 0.45, ease: EASE }}
            >
              MYR 1,500
            </motion.span>
          </motion.div>
        </div>
        <motion.div
          className="absolute left-[3.25vmin] top-[32%] bottom-[12%] w-[.38vmin] rounded-full bg-[#83bda0] origin-top"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 2.7, duration: 0.65, ease: EASE }}
        />
      </motion.div>

      <div className="absolute right-[8%] top-[27%] w-[21%]">
        <motion.div
          className="eyebrow text-[#a7d6bf] mb-[1.4vmin]"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2, duration: 0.45 }}
        >
          REQUIRED DETAILS
        </motion.div>
        <motion.p
          className="display text-[3.7vmin] leading-[1.05] tracking-[-.05em] m-0 font-medium"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.72, duration: 0.55, ease: EASE }}
        >
          Checked.<br />
          <span className="text-[#a7d6bf]">Still pending.</span>
        </motion.p>
        <motion.div
          className="mt-[2.5vmin] flex items-center gap-[1vmin] tiny text-white/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.1, duration: 0.4 }}
        >
          <span className="inline-block w-[.9vmin] h-[.9vmin] rounded-full bg-[#e5b45f]" />
          Request remains with people
        </motion.div>
      </div>
      <motion.div
        className="absolute left-[62%] top-[50%] h-[.35vmin] bg-[#d1a354] origin-left"
        initial={{ width: 0, rotate: -14 }}
        animate={{ width: '31%', rotate: -14 }}
        transition={{ delay: 3.25, duration: 0.65, ease: EASE }}
      />
      <motion.span
        className="absolute left-[90%] top-[42%] text-[2vmin] text-[#f1ce89] mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.55, duration: 0.3 }}
      >
        MYR
      </motion.span>
      <div className="absolute bottom-[6%] right-[6%] eyebrow text-white/30">SYNTHETIC DEMO DATA</div>
    </motion.section>
  );
}

export default Scene2;
