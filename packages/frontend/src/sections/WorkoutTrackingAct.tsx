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
import { Hourglass, Play } from "lucide-react"
import { useEffect, useState } from "react"
import type { WorkoutDetail } from "shared"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"

const WorkoutTrackingAct = () => {
  const [workouts, setWorkout] = useState<WorkoutDetail[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [intensity, setIntensity] = useState<"low" | "medium" | "high" | undefined>("medium");   
  const wor_id = 'WOR00001'; // 예시 운동 기록 ID
  useEffect(() => {
    // 운동정보 조회 
    fetch(`http://localhost:3001/api/getWorkoutDetails?wor_id=${wor_id}`)
      .then(res => res.json())
      .then(data => {
        setWorkout(data.data); 
    });    
  }, []);   
  const handleAIRecommend = async () => {
    if (isLoading) return;
    
    setIsLoading(true);  // 로딩 시작!
    try {
      const response = await fetch('http://localhost:3001/api/ai/recExercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: { 
            mem_id: 1, 
            intensity: intensity
          }
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const formatted: WorkoutDetail[] = data.data.map((item: any) => ({
        WOO_ID: item.WOO_ID,
        WOO_NAME: item.WOO_NAME,
        WOO_GUIDE: item.WOO_GUIDE || "AI가 추천한 운동입니다.",
        WOO_IMG: item.WOO_IMG,
      })); 
      setWorkout(formatted);
    } catch (error) {
      console.error("❌ AI 추천 실패:", error);
    } finally {
      setIsLoading(false);  // 성공/실패 상관없이 로딩 종료
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
          <div className="flex items-end gap-4">
            <div className="flex items-end gap-4">
              {isLoading && <Hourglass className="size-6 animate-spin" />}              
              <Button className="text-lg border-2 shadow-lg" onClick={handleAIRecommend} disabled={isLoading}>AI추천</Button>    
            </div> 
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
          </div>      
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-8">
          <div className="text-xl">
            오늘의 운동 프로그램
          </div>
          {workouts?.map((workout, index) => {
            return (
              <Workout key={workout.WOO_ID ?? `workout-${index}`} workout={workout} index={index} />
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
              {workout.WOO_NAME}
            </div>
            <div className="text-primary"> 
              {workout.WOO_GUIDE}
            </div>
        </div>
        <div>
          <img 
            src={workout.WOO_IMG}  // 새 투명 PNG 사용
            alt={workout.WOO_NAME} 
            className="w-20 h-20 object-contain hover:animate-heartbeat hover:scale-140 hover:ring-4 hover:ring-emerald-400/50 transition-all duration-700 bg-linear-to-br rounded-xl" 
          />                  
        </div>  
      </div>
      <div className="text-2xl"> 
        {workout.WOD_TARGET_REPS}회&nbsp;{workout.WOD_TARGET_SETS}세트  
      </div>
    </div>
  );
};


export default WorkoutTrackingAct;