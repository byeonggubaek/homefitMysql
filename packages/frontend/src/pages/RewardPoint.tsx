import WdogBreadClum from "@/components/WdogBreadClum";
import RewardPointMain from "@/sections/RewardPointMain";

export default function RewardPoint() {
  return (
    // 💡 [핵심 1] flex-1과 min-h-0을 동시에 써서 부모(Layout) 영역을 절대 넘지 않게 가둡니다!
    <div className="flex flex-col flex-1 w-full min-h-0 overflow-hidden bg-transparent"> 
      
      <div className="shrink-0 px-4 pt-4">
        <WdogBreadClum page="RewardPoint" />
      </div>

      {/* 💡 [핵심 2] 여기도 min-h-0 필수! 내부 컨텐츠가 아무리 커도 여기서 컷팅합니다. */}
      <div className="flex-1 min-h-0 overflow-hidden p-4 pt-2">
        <RewardPointMain />
      </div>

    </div>
  );
}