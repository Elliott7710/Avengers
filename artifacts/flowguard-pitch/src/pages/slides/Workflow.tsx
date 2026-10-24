export default function Workflow() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck">
      <h1 className="heading">From request to logged outcome</h1>
      <div className="absolute left-[6vw] top-[32vh] w-[88vw] h-[53vh] grid grid-cols-5 gap-[1.6vw] body">
        <div className="slate px-[1.6vw] pt-[4vh]">
          <p className="text-[5vw] leading-[1] font-extrabold mb-[4vh] opacity-70">1</p>
          <p><span className="strong">Trigger:</span> an employee submits a travel request</p>
        </div>
        <div className="bg-[#dce7ec] px-[1.6vw] pt-[4vh]">
          <p className="text-[5vw] leading-[1] font-extrabold mb-[4vh] text-primary">2</p>
          <p><span className="strong">Data:</span> destination, dates, purpose, and estimated cost</p>
        </div>
        <div className="bg-[#dce7ec] px-[1.6vw] pt-[4vh]">
          <p className="text-[5vw] leading-[1] font-extrabold mb-[4vh] text-primary">3</p>
          <p><span className="strong">Logic:</span> required-field checks and an illustrative budget flag</p>
        </div>
        <div className="green px-[1.6vw] pt-[4vh]">
          <p className="text-[5vw] leading-[1] font-extrabold mb-[4vh] text-primary">4</p>
          <p><span className="strong">Approval:</span> a different manager records a decision and reason</p>
        </div>
        <div className="slate px-[1.6vw] pt-[4vh]">
          <p className="text-[5vw] leading-[1] font-extrabold mb-[4vh] opacity-70">5</p>
          <p><span className="strong">Outcome:</span> updated status and append-only activity history</p>
        </div>
      </div>
      <p className="brand">FlowGuard</p><p className="page">03 / 08</p>
    </div>
  );
}
