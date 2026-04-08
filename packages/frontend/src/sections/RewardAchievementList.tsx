  import { useState, useEffect } from "react";
  import { Trophy, Star, Lock, CheckCircle2, Target, Flame, Award, Dumbbell } from "lucide-react";
  import { Card } from "../components/ui/card";
  import { Progress } from "../components/ui/progress";
  import { Badge } from "../components/ui/badge";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useUser } from "@/hooks/UserContext";
import type { Achievement } from "shared";

  // [핵심 1] DB에서 넘어올 데이터 모양 정의


  export default function RewardAchievementList() {
    const {member} = useUser();    
    // 1-1. 상태 관리: 전체 업적 데이터를 담을 그릇
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);

    // 1-2. 데이터 불러오기 (백엔드 API 호출)
    useEffect(() => {
      if (!member?.MEM_ID) return;      
      const mem_id = member.MEM_ID; 
      fetch(`http://localhost:3001/api/reward/get_achievement_list?mem_id=${mem_id}`)
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            setAchievements(result.data);
          }
          setLoading(false);
        })
        .catch(err => console.error("업적 로딩 실패:", err));
    }, [member?.MEM_ID]);

    // 1-3. 상태별 데이터 분류 (탭 메뉴용)
  
    const completedList = achievements.filter(a => a.status === 'completed');
    const inProgressList = achievements.filter(a => a.status === 'inProgress');
    const lockedList = achievements.filter(a => a.status === 'locked');

    // 1-4. 통계 계산
    const totalCount = achievements.length;
    const completedCount = completedList.length;
    const totalEarnedPoints = completedList.reduce((sum, a) => sum + a.points, 0);
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    if (loading) return <div className="p-8 text-center">업적 메달 닦는 중... 🏅</div>;

    return (
      <div className="flex flex-1 w-full gap-4 p-4 bg-gray-50/50 font-sans overflow-hidden h-full">

        {/* ---------------- 왼쪽 영역 (통계 카드) ---------------- */}
        <div className="w-[30%] min-w-[320px] max-w-100 flex flex-col gap-4">
          <Card className="bg-gray-50 text-black border-0 shadow-lg relative overflow-hidden shrink-0 p-6 rounded-2xl">
            <div className="relative z-10">
              <p className="text-black-400 mb-1">업적 달성률</p>
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-8 h-8 text-black-400" />
                <h2 className="font-bold text-4xl">{completedCount}/{totalCount}</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-200/10 backdrop-blur-sm rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Star className="w-3 h-3" />
                    <p className="text-black-400">획득 포인트</p>
                  </div>
                  <p className="font-bold text-xl">+{totalEarnedPoints}</p>
                </div>
                <div className="bg-gray-200/10 backdrop-blur-sm rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Target className="w-3 h-3" />
                    <p className="text-black-400">완료율</p>
                  </div>
                  <p className="font-bold text-xl">{completionRate}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-black-400">전체 진행도</span>
                  <span className="font-semibold">{completedCount}개 완료</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border-0 mt-auto shrink-0 p-4 text-center shadow-sm rounded-2xl">
            <Dumbbell className="w-8 h-8 mx-auto mb-2 text-black-400" />
            <h3 className="font-bold mb-1 text-gray-800">도전을 멈추지 마세요!</h3>
            <p className="text-black-500 leading-tight">
              꾸준한 운동 기록이 모여 <br />
              당신만의 특별한 업적이 됩니다.
            </p>
          </Card>
        </div>

        {/* ---------------- 오른쪽 영역 (리스트) ---------------- */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="inProgress" className="w-full flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm mb-4 shrink-0 rounded-xl p-1 border-0">
              <TabsTrigger value="inProgress" className="rounded-lg font-bold">진행 중</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg font-bold">완료</TabsTrigger>
              <TabsTrigger value="locked" className="rounded-lg font-bold">잠김</TabsTrigger>
            </TabsList>

            <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
              {/* 진행 중 탭 */}
              <TabsContent value="inProgress" className="mt-0 flex-1 flex flex-col overflow-hidden outline-none">
                <div className="flex items-center justify-between px-1 mb-2">
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {inProgressList.map(a => <AchievementCard key={a.id} achievement={a} />)}
                </div>
              </TabsContent>

              {/* 완료 탭 */}
              <TabsContent value="completed" className="mt-0 flex-1 flex flex-col overflow-hidden outline-none">
                <div className="flex items-center justify-between px-1 mb-2">
                  <h3 className="font-bold text-sm text-gray-900">달성 완료! ({completedList.length})</h3>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {completedList.map(a => <AchievementCard key={a.id} achievement={a} />)}
                </div>
              </TabsContent>

              {/* 잠금 탭 */}
              <TabsContent value="locked" className="mt-0 flex-1 flex flex-col overflow-hidden outline-none">
                <div className="flex items-center justify-between px-1 mb-2">
                  <h3 className="font-bold text-sm text-gray-900">잠긴 업적 ({lockedList.length})</h3>
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {lockedList.map(a => <AchievementCard key={a.id} achievement={a} />)}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    );
  }

  // [공통 카드 컴포넌트]
  function AchievementCard({ achievement }: { achievement: Achievement }) {
    const isLocked = achievement.status === 'locked';
    const isCompleted = achievement.status === 'completed';

    return (
      <Card className={`bg-white hover:shadow-md transition-all border border-gray-100 rounded-2xl overflow-hidden ${isLocked ? 'opacity-70' : ''}`}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* 아이콘 영역 */}
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 relative
              ${isCompleted ? 'bg-emerald-50' : isLocked ? 'bg-gray-100' : 'bg-amber-50'}`}>
              {/* DB의 이미지 경로가 있으면 <img>, 아니면 텍스트(이모지) 출력 */}
              {achievement.icon.startsWith('/') ? (
                <img
                  src={achievement.icon}
                  alt={achievement.title}
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    // 💡 에러(엑스박스)가 나면 예쁜 기본 트로피 아이콘으로 스윽 바꿔치기 합니다.
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9H4.5a2.5 2.5 0 0 1 0-5H6'/%3E%3Cpath d='M18 9h1.5a2.5 2.5 0 0 0 0-5H18'/%3E%3Cpath d='M4 22h16'/%3E%3Cpath d='M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22'/%3E%3Cpath d='M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22'/%3E%3Cpath d='M18 2H6v7a6 6 0 0 0 12 0V2Z'/%3E%3C/svg%3E";
                  }}
                />
              ) : (
                achievement.icon
              )}
              {isLocked && <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center"><Lock className="w-5 h-5 text-gray-400" /></div>}
              {isCompleted && <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white"><CheckCircle2 className="w-3 h-3 text-white" /></div>}
            </div>

            {/* 텍스트 영역 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-bold truncate">{achievement.title}</h4>
                <Badge variant="secondary" className="bg-gray-100 text-gray-600 shrink-0 border-0">
                  +{achievement.points}P
                </Badge>
              </div>
              <p className="text-sm line-clamp-1 mb-3 text-primary">{achievement.description}</p>

              {!isLocked && !isCompleted && (
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="">{achievement.progress}회 진행</span>
                    <span className="text-black-600 font-bold">{Math.round(achievement.progressPercentage)}%</span>
                  </div>
                  <Progress value={achievement.progressPercentage} />
                </div>
              )}

              {isCompleted && (
                <p className="text-emerald-600 font-medium italic">
                  {achievement.completedDate} 달성 완료
                </p>
              )}

              {isLocked && (
                <p className="text-gray-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> 도전 조건 미충족
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }