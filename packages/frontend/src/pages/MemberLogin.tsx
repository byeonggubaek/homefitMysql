import WdogBreadClum from "@/components/WdogBreadClum";
import MemberLoginMain from "@/sections/MemberLoginMain";

export default function MemberLogin() {

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        <WdogBreadClum page="MemberLogin"/> 
      </div>
      <div className="flex gap-4 w-full">
        <MemberLoginMain />
      </div>     
    </div>
  );
}