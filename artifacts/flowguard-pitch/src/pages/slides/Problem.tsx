export default function Problem() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck">
      <h1 className="heading">One recurring SME burden: travel approvals</h1>
      <div className="absolute left-[6vw] top-[35vh] w-[88vw] grid grid-cols-3 gap-[4vw] body">
        <div className="rule pt-[3vh]"><p>Request details can be scattered across messages and spreadsheets</p></div>
        <div className="rule pt-[3vh]"><p>Missing context leads to repeated clarification</p></div>
        <div className="rule pt-[3vh]"><p>Employees need a clear view of status and decisions</p></div>
      </div>
      <div className="absolute left-[6vw] right-[6vw] top-[69vh] green px-[2.4vw] py-[3vh] body">
        <p><span className="strong">Problem hypothesis:</span> customer research and a timed baseline are still needed</p>
      </div>
      <p className="brand">FlowGuard</p><p className="page">02 / 08</p>
    </div>
  );
}
