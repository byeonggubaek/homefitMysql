import WdogBreadClum from "@/components/WdogBreadClum";
import MemberProfileLeft from "@/sections/MemberProfileLeft";
import MemberProfileMain from "@/sections/MemberProfileMain";
import MemberProfilePremium from "@/sections/MemberProfilePremium";
import MemberProfileSetting from "@/sections/MemberProfileSetting";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function MemberProfile() {
  const { part: paramPart } = useParams<{ part: string }>();
  const [part, setPart] = useState<string>(paramPart || "profile");
  useEffect(() => {
    if (paramPart) {
      setPart(paramPart);
    }
  }, [paramPart]);
  
  const handleChildData = (data: string) => { setPart(data); };
  const renderContent = () => {
    switch (part) {
      case "profile":
        return <MemberProfileMain  />;

      case "premium":
        return <MemberProfilePremium />;
      case "setting":
        return <MemberProfileSetting />;
      default:
        return <MemberProfileMain />;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        <WdogBreadClum page="MemberProfile" />
      </div>
      <div className="flex gap-10">
        <div className="w-2/7">
          <MemberProfileLeft onChildData={handleChildData} />
        </div>
        <div className="w-5/7">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}