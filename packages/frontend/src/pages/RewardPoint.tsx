import WdogBreadClum from "@/components/WdogBreadClum";
import RewardPointMain from "@/sections/RewardPointMain";

export default function RewardPoint() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        <WdogBreadClum page="RewardPoint" />
      </div>
      <div className="flex gap-4 w-full">
        <RewardPointMain />
      </div>
    </div>
  );
}