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
import { Hourglass, Play } from "lucide-react"
import { useEffect, useState } from "react"
import type { WorkoutDetail } from "shared"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser } from "@/hooks/UserContext"
import { useNavigate } from "react-router-dom"
import WdogWorkout from "@/components/WdogWorkout"

const WorkoutDashboardAct = () => {
  const navigate = useNavigate();  // 👈 navigate 함수 생성  
  const {member} = useUser();  // Context에서 공유  
  const [workouts, setWorkout] = useState<WorkoutDetail[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [intensity, setIntensity] = useState<"low" | "medium" | "high" | undefined>("medium");   
  const [wor_id, setWorId] = useState(''); // 예시 운동 기록 ID
  useEffect(() => {
    // 운동정보 조회 
    fetch(`http://localhost:3001/api/workout/getWorkoutDetails?mem_id=${member?.MEM_ID?? ''}&wor_id=${wor_id}`)
      .then(res => res.json())
      .then(data => {
        setWorkout(data.data); 
        setWorId(data.data[0]?.WOR_ID || ''); // 첫 번째 운동 기록 ID 저장 (예시)
    });    
  }, [member?.MEM_ID]);   
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
      const formatted: WorkoutDetail[] = data.data.map((workout: any) => ({
        WOO_ID: workout.WOO_ID,
        WOO_NAME: workout.WOO_NAME,
        WOO_IMG: workout.WOO_IMG,
        WOO_UNIT: workout.WOO_UNIT || "회",
        WOD_GUIDE: workout.WOD_GUIDE || "AI가 추천한 운동입니다.",
        WOD_TARGET_REPS: workout.WOD_TARGET_REPS || 0,
        WOD_TARGET_SETS: workout.WOD_TARGET_SETS || 0,
      }));
      console.log("✅ formatted:",formatted); // 💡 AI 추천 응답 로그
      setWorkout(formatted);
    } catch (error) {
      console.error("❌ AI 추천 실패:", error);
    } finally {
      setIsLoading(false);  // 성공/실패 상관없이 로딩 종료
    }
  };
  const handleWorkoutStart = () => {
    // navigation to workout session page or start workout logic
    navigate('/workout/start');
  }
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-3xl">운동 시작하기</CardTitle>
        <CardDescription className="text-sm text-primary">
          AI가 실시간으로 자세를 분석하고 피드백을 제공합니다
        </CardDescription>
        <CardAction>
          <div className="flex items-end gap-4">
            {member != null && member?.MES_ID !== 'MES00001' && <>         
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
            </>}   
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
              <WdogWorkout key={workout.WOO_ID ?? `workout-${index}`} workout={workout} index={index} />
            )})}
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full text-3xl mt-8 py-8 rounded-2xl shadow-lg" onClick={handleWorkoutStart}>
          운동시작하기
          <Play className="size-8" />
        </Button>
      </CardFooter>
    </Card>
  )
}

export default WorkoutDashboardAct;