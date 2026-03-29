import type { WorkoutDetail } from "shared"
import { Badge } from "./ui/badge";

interface WdogWorkoutProps {
  workout: WorkoutDetail, 
  index: number,
  type?: "dashboard" | "start",
  actualReps?: number,
  actualSets?: number
}

export default function WdogWorkout({
  workout,
  index,
  type = "dashboard",
  actualReps = 0,
  actualSets = 0
}: WdogWorkoutProps) {
  return (
    <div className="flex gap-3 items-start justify-between bg-gray-100 p-4 h-25"> 
      <div className="flex gap-3">
        <Badge className="h-13 w-13 rounded-full p-0 flex items-center justify-center text-xl font-bold">
          {index + 1}
        </Badge>
        <div> 
            <div className="text-xl font-bold whitespace-nowrap">
              {workout.WOO_NAME}
            </div>
            <div className="text-primary line-clamp-2"> 
              {workout.WOD_GUIDE}
            </div>
        </div>
        <div className ="flex items-start justify-start center">
          <img 
            src={workout.WOO_IMG}  // 새 투명 PNG 사용
            alt={workout.WOO_NAME} 
            className="w-16 h-16 object-contain hover:animate-heartbeat hover:scale-140 hover:ring-4 hover:ring-emerald-400/50 transition-all duration-700 bg-linear-to-br rounded-xl" 
          />                  
        </div>  
      </div>
      <div className="text-2xl whitespace-nowrap"> 
          <div>
            {workout.WOD_TARGET_REPS} {workout.WOO_UNIT} &nbsp;{workout.WOD_TARGET_SETS}세트  
          </div>          
          {type === "start" && (
            <div className="text-focus">
              {actualReps} {workout.WOO_UNIT} &nbsp;{actualSets}세트
            </div>
          )}
      </div>
    </div>
  );
}
