import WdogBreadClum from "@/components/WdogBreadClum";
import MemberSignupMain from "@/sections/MemberSignupMain";

export default function MemberSignup() {

  return (
    <div className="flex flex-col gap-3">
      <div>
        <WdogBreadClum page="MemberSignup"/> 
      </div>
      <div>
        <MemberSignupMain />
      </div>
    </div>
  );
}