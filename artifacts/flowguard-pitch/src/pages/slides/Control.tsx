export default function Control() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck">
      <h1 className="heading w-[83vw]">Automate the checks. Keep people in control.</h1>
      <div className="absolute left-[6vw] top-[35vh] w-[37vw] h-[48vh] green px-[2.4vw] py-[4vh] body">
        <p className="strong">Team-scoped access for employees and managers</p>
        <p className="mt-[5vh]">Employees manage pending requests; managers approve or reject</p>
      </div>
      <div className="absolute left-[49vw] top-[35vh] w-[45vw] body">
        <p className="rule pt-[2vh]">Illustrative MYR 1,000 threshold flags review—not automatic approval</p>
        <p className="rule pt-[2vh] mt-[3vh]">Booking notes record status; FlowGuard does not buy travel</p>
        <p className="rule pt-[2vh] mt-[3vh]">Database policies and triggers enforce workflow rules</p>
      </div>
      <p className="brand">FlowGuard</p><p className="page">04 / 08</p>
    </div>
  );
}
