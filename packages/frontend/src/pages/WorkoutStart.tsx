import WdogBreadClum from "@/components/WdogBreadClum";
import WorkoutStartMain from "@/sections/WorkoutStartMain";

export default function WorkoutStart() {    
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        <WdogBreadClum page="WorkoutDashboard"/> 
      </div>
      <div className="flex gap-4 w-full">
        <WorkoutStartMain />
      </div>     
    </div>
  );
}