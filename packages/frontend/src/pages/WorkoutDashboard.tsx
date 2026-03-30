import WdogBreadClum from "@/components/WdogBreadClum";
import WorkoutDashboardAct from "@/sections/WorkoutDashboardAct";
import WorkoutDashboardUser from "@/sections/WorkoutDashboardUser";
import WorkoutDashboardHis from "@/sections/WorkoutDashboardHis";

export default function WorkoutDashboard() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        <WdogBreadClum page="WorkoutDashboard"/> 
      </div>
      <div className="flex gap-4 w-full">
        <div className="w-3/4">
          <WorkoutDashboardAct />      
        </div>
        <div className="flex flex-col gap-2 w-1/4">
          <WorkoutDashboardUser />     
          <WorkoutDashboardHis /> 
        </div>
      </div>     
    </div>
  );
}