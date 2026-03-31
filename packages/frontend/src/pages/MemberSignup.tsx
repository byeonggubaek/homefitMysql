import WdogBreadClum from "@/components/WdogBreadClum";
import { useUser } from "@/hooks/UserContext";
import MemberSignupMain from "@/sections/MemberSignupMain";

export default function MemberSignup() {
  const { member } = useUser();  // Context에서 공유
  return (
    <div className="flex flex-col gap-3">
      {member &&       
        <div>
          <WdogBreadClum page="MemberSignup"/> 
        </div>
      }
      <div>
        <MemberSignupMain />
      </div>
    </div>
  );
}