import WdogBreadClum from "@/components/WdogBreadClum";
import MemberLogoutMain from "@/sections/MemberLogoutMain";

export default function MemberLogout() {

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        <WdogBreadClum page="MemberLogout"/> 
      </div>
      <div className="flex gap-4 w-full">
        <MemberLogoutMain />
      </div>     
    </div>
  );
}