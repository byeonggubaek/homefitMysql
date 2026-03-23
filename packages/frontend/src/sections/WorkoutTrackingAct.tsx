import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play } from "lucide-react"
import { useEffect, useState } from "react"
import type { WorkoutDetail } from "shared"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"

const WorkoutTrackingAct = () => {
   const [workouts, setWorkout] = useState<WorkoutDetail[] | null>(null);
   const [isLoading, setIsLoading] = useState(false);
   const [intensity, setIntensity] = useState<"low" | "medium" | "high" | undefined>("medium");   
   const workoutRecordId = 'WOR00001'; // 예시 운동 기록 ID
   useEffect(() => {
     // 운동정보 조회 
     fetch(`http://localhost:3001/api/get_workout_detail?wor_id=${workoutRecordId}`)
       .then(res => res.json())
       .then(data => {
         setWorkout(data.data); 
         console.log("초기 운동 정보:", data.data); // 💡 초기 운동 정보 로그
     });    
   }, []);   
  const handleAIRecommend = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      console.log("AI 추천 요청 - 선택된 강도:", intensity); // 💡 AI 추천 요청 로그
      fetch('http://localhost:3001/api/recommend-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: { 
            mem_join_id: 1, 
            intensity: intensity
          }
        })
      })
      .then(res => res.json())
      .then(data => {
          const formatted: WorkoutDetail[] = data.data.map((item: any) => ({
            woo_id: item.woo_id,
            woo_name: item.woo_name,
            woo_guide: item.woo_guide || "AI가 추천한 운동입니다.",
            wod_target_sets: item.wod_target_sets,
            wod_target_reps: item.wod_target_reps,
            woo_img: item.woo_img 
          }));         
          setWorkout(formatted); 
          console.log("AI 추천 운동 정보:", formatted); // 💡 AI 추천 운동 정보 로그
        });    

    } catch (error) {
      console.error("추천 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-3xl">운동 시작하기</CardTitle>
        <CardDescription className="text-lg text-primary">
          AI가 실시간으로 자세를 분석하고 피드백을 제공합니다
        </CardDescription>
        <CardAction>
          <Button className="text-lg border-2 shadow-lg" onClick={handleAIRecommend}>{isLoading ? "추천 중..." : "AI추천"}</Button>          
          <Select onValueChange={(value) => setIntensity(value as "low" | "medium" | "high")}>
                <SelectTrigger className="w-full max-w-48">
                  <SelectValue placeholder="운동 강도 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>운동 강도</SelectLabel>
                    <SelectItem value="low">가볍게</SelectItem>
                    <SelectItem value="medium">보통</SelectItem>
                    <SelectItem value="high">강하게</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>          
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-8">
          <div className="text-xl">
            오늘의 운동 프로그램
          </div>
          {workouts?.map((workout, index) => {
            return (
              <Workout key={workout.woo_id ?? `workout-${index}`} workout={workout} index={index} />
            )})}
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full text-3xl mt-8 py-8 rounded-2xl shadow-lg">
          운동시작하기
          <Play className="size-8" />
        </Button>
      </CardFooter>
    </Card>
  )
}

const Workout = ({ workout, index } : { workout: WorkoutDetail, index: number }) => {
  return (
    <div className="flex gap-3 items-start justify-between bg-gray-100 p-4 h-20"> 
      <div className="flex gap-3">
        <Badge className="h-13 w-13 rounded-full p-0 flex items-center justify-center text-xl font-bold">
          {index + 1}
        </Badge>
        <div> 
            <div className="text-xl font-bold">
              {workout.woo_name}
            </div>
            <div className="text-primary"> 
              {workout.woo_guide}
            </div>
        </div>
        <div>
          <img 
            src={workout.woo_img}  // 새 투명 PNG 사용
            alt={workout.woo_name} 
            className="w-20 h-20 object-contain hover:animate-heartbeat hover:scale-140 hover:ring-4 hover:ring-emerald-400/50 transition-all duration-700 bg-linear-to-br rounded-xl" 
          />                  
        </div>  
      </div>
      <div className="text-2xl"> 
        {workout.wod_target_reps}회&nbsp;{workout.wod_target_sets}세트  
      </div>
    </div>
  );
};


export default WorkoutTrackingAct;