import WdogBreadClum from "@/components/WdogBreadClum";
import { useUser } from "@/hooks/UserContext";
import MemberLoginMain from "@/sections/MemberLoginMain";

export default function MemberLogin() {
  const { member } = useUser();  // Context에서 공유
  return (
    <div className="flex flex-col gap-3">
      {member && 
        <div className="flex gap-4">
          <WdogBreadClum page="MemberProfile"/> 
        </div>
      }
      <div className="flex gap-4 w-full">
        <MemberLoginMain />
      </div>     
    </div>
  );
}