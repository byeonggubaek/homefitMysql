import WdogBreadClum from "@/components/WdogBreadClum";
import WorkoutStartMain from "@/sections/WorkoutStartMain";
import { useParams } from "react-router-dom";

export default function WorkoutStart() {    
  const { wor_id: paramWorId } = useParams<{ wor_id: string }>();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        <WdogBreadClum page="WorkoutDashboard"/> 
      </div>
      <div className="flex gap-4 w-full">
        <WorkoutStartMain wor_id={paramWorId ?? null} />
      </div>     
    </div>
  );
}