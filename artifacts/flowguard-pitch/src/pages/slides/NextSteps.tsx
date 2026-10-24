export default function NextSteps() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck">
      <h1 className="heading">Next: validate the benefit and finish the evidence</h1>
      <div className="absolute left-[6vw] top-[33vh] w-[88vw] body grid grid-cols-2 gap-x-[5vw] gap-y-[3vh]">
        <p className="rule pt-[2vh]">Rehearse and record the published employee-to-manager workflow</p>
        <p className="rule pt-[2vh]">Capture Replit proof and complete the official submission forms</p>
        <p className="rule pt-[2vh]">Verify one authorised synthetic Runpod request before claiming usage</p>
        <p className="rule pt-[2vh]">Measure equivalent manual and FlowGuard review tasks</p>
        <p className="rule pt-[2vh] col-span-2">Test with SME users and confirm Orbyte compatibility requirements</p>
      </div>
      <div className="absolute left-0 right-0 bottom-[5vh] green px-[6vw] py-[3vh]">
        <p className="text-[2.6vw] font-bold leading-[1.25]">FlowGuard: one request, one accountable decision, one visible history</p>
      </div>
    </div>
  );
}
