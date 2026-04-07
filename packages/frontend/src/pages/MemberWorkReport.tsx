import WdogBreadClum from "@/components/WdogBreadClum";
import MemberWorkReportMain from "@/sections/MemberWorkReportMain";


export default function MemberWorkReport() {

  return (
    <div className="flex flex-col gap-3">
      <div>
        <WdogBreadClum page="MemberWorkReport"/> 
      </div>
      <div>
        <MemberWorkReportMain />
      </div>
    </div>
  );
}