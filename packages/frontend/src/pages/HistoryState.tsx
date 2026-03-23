import WdogBreadClum from "@/components/WdogBreadClum";
import HistoryStateMain from "@/sections/HistoryStateMain";

export default function HistoryState() {  
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        <WdogBreadClum page="HistoryState"/> 
      </div>
      <HistoryStateMain />
    </div>
  );
}

