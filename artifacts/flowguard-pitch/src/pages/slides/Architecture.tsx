export default function Architecture() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck">
      <h1 className="heading">A lightweight stack with optional AI assistance</h1>
      <div className="absolute left-[6vw] top-[33vh] w-[48vw] body">
        <div className="rule pt-[2vh] pb-[3vh]"><p><span className="strong">Interface:</span> HTML, CSS, and vanilla JavaScript, served with Vite</p></div>
        <div className="rule pt-[2vh] pb-[3vh]"><p><span className="strong">Replit API:</span> Node.js and Express</p></div>
        <div className="rule pt-[2vh]"><p><span className="strong">Supabase:</span> authentication, PostgreSQL, and access policies</p></div>
      </div>
      <div className="absolute left-[60vw] top-[33vh] w-[34vw] body border-t-[0.7vh] border-primary pt-[3vh]">
        <p className="strong">Optional Runpod Qwen3 32B AWQ summary: manager-requested and advisory</p>
        <p className="mt-[5vh] muted">Live Runpod inference is not yet verified; rules remain deterministic</p>
      </div>
      <p className="brand">FlowGuard</p><p className="page">05 / 08</p>
    </div>
  );
}
