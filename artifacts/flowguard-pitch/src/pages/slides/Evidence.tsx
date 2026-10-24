export default function Evidence() {
  return (
    <div className="w-screen h-screen overflow-hidden relative deck">
      <h1 className="heading">Working demo, with clear evidence limits</h1>
      <div className="absolute left-[6vw] top-[34vh] w-[30vw] body">
        <p><span className="block text-[12vw] leading-[1] font-extrabold text-primary">23</span> unit tests passed in the latest recorded cleanup check</p>
      </div>
      <div className="absolute left-[43vw] top-[34vh] w-[51vw] body">
        <p className="strong">Workspace typecheck and frontend production build passed</p>
        <p className="mt-[3vh]">Owner reports live employee/manager request access and approval with note and history</p>
        <p className="mt-[3vh] muted">These checks are not a complete security or production-readiness audit</p>
        <p className="mt-[3vh] muted">Published-site access, video evidence, and Runpod proof remain pending</p>
      </div>
      <p className="brand">FlowGuard</p><p className="page">07 / 08</p>
    </div>
  );
}
