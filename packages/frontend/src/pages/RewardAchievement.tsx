import WdogBreadClum from "@/components/WdogBreadClum";
import RewardAchievementList from "@/sections/RewardAchievementList";

export default function RewardAchievement() {
  return (
    <div className="flex flex-col gap-4">
      {/* 브레드크럼 */}
      <WdogBreadClum page="RewardAchievement" />

      <div>
        {/* 업적 리스트 섹션 */}
        <RewardAchievementList />
      </div>
    </div>
  );
}