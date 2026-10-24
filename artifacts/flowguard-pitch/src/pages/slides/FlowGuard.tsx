export default function FlowGuard() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck">
      <div className="absolute right-0 top-0 h-screen w-[33vw] green" />
      <div className="absolute left-[6vw] top-[19vh] w-[62vw]">
        <h1 className="font-display text-[8.6vw] font-extrabold leading-[1] text-primary">FlowGuard</h1>
        <p className="mt-[5vh] text-[2.65vw] leading-[1.3] w-[56vw]">Travel requests, human decisions, and activity history in one workspace.</p>
        <p className="mt-[8vh] body strong">Team Avengers · Asia Pacific University</p>
        <p className="mt-[2vh] text-[1.65vw] leading-[1.35] muted">SDC 2026 · Domain 2: Orbyte Smart SME Challenge</p>
      </div>
      <svg className="absolute right-[4vw] top-[25vh] w-[25vw] h-[46vh] text-primary" viewBox="0 0 300 300" fill="none" aria-hidden="true">
        <path d="M30 42H120V105H220V185H115V260H270" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="10" y="22" width="40" height="40" rx="8" fill="#eef3f5" stroke="currentColor" strokeWidth="4" />
        <rect x="98" y="83" width="44" height="44" rx="8" fill="#eef3f5" stroke="currentColor" strokeWidth="4" />
        <rect x="190" y="155" width="60" height="60" rx="12" fill="#355b6b" />
        <path d="M203 184L216 197L238 173" stroke="#eef3f5" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="95" y="240" width="40" height="40" rx="8" fill="#eef3f5" stroke="currentColor" strokeWidth="4" />
      </svg>
    </div>
  );
}
