import { useState, useEffect } from "react";
import { TrendingUp, BarChart3, Trophy, Flame, Timer, Dumbbell, Ticket, Gift, Clock, HistoryIcon } from "lucide-react";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { format, endOfMonth } from 'date-fns';
import type { PointHistory } from "shared";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/UserContext";

const CountUp = ({ end, duration = 1000 }: { end: number; duration?: number }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [end, duration]);
    return <>{count.toLocaleString()}</>;
};

const levels = [
    { level: 1, name: '입문', minPoints: 0, maxPoints: 1000, color: 'bg-gray-400' },
    { level: 2, name: '초급', minPoints: 1000, maxPoints: 3000, color: 'bg-green-400' },
    { level: 3, name: '중급', minPoints: 3000, maxPoints: 7000, color: 'bg-blue-400' },
    { level: 4, name: '고급', minPoints: 7000, maxPoints: 15000, color: 'bg-purple-400' },
    { level: 5, name: '마스터', minPoints: 15000, maxPoints: Infinity, color: 'bg-amber-400' }
];

const getHistoryIcon = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("squat") || n.includes("스쿼트")) return <Flame className="w-4 h-4 text-orange-500" />;
    if (n.includes("pushup") || n.includes("푸시업")) return <Dumbbell className="w-4 h-4 text-emerald-600" />;
    if (n.includes("lunge") || n.includes("런지")) return <TrendingUp className="w-4 h-4 text-purple-500" />;
    if (n.includes("plank") || n.includes("플랭크")) return <Timer className="w-4 h-4 text-blue-500" />;
    if (n.includes("invoice") || n.includes("회원권") || n.includes("구매")) return <Ticket className="w-4 h-4 text-indigo-500" />;
    if (n.includes("업적")) return <Trophy className="w-4 h-4 text-amber-500" />;
    return <Gift className="w-4 h-4 text-amber-500" />;
};

const pointEarningMethods = [
    { id: 1, title: "운동 완료", description: "1분당 10P + 완료 보너스 50P" },
    { id: 2, title: "업적 달성", description: "업적 달성 시 50~500P 획득" },
    { id: 3, title: "자세 정확도", description: "정확도 90% 이상 시 보너스" },
    { id: 4, title: "연속 운동", description: "스트릭 유지 시 매일 지급" },
];

export default function RewardPointMain() {
    const {member} = useUser();
    const [historyData, setHistoryData] = useState<PointHistory[]>([]);
    const [totalPoints, setTotalPoints] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const navigate = useNavigate();
    
    const today = new Date();
    const monthEnd = endOfMonth(today);

    useEffect(() => {
        if (!member?.MEM_ID) return;      
        const mem_id = member.MEM_ID; 

        const fromDate = "2026-03-01";
        const toDate = format(monthEnd, 'yyyy-MM-dd');

        // 1. 포인트 내역 가져오기
        fetch(`http://localhost:3001/api/reward/getPoint?mem_id=${mem_id}&from=${fromDate}&to=${toDate}`)
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    setHistoryData(result.data);
                }
            })
            .catch(err => console.error("내역 fetch 실패:", err));

        setTotalPoints(Number(member?.MEM_POINT) || 0);    

        // 3. 업적 현황 가져오기 (0/0 해결)
        fetch(`http://localhost:3001/api/reward/get_achievement_list?mem_id=${mem_id}`)
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    const completed = result.data.filter((a: any) => a.status === 'completed');
                    setCompletedCount(completed.length);
                    setTotalCount(result.data.length);
                }
            });
    }, [member?.MEM_ID]);

    // 💡 [핵심] 리스트에 있는 모든 포인트를 합산하여 표시 (1,800P 연출)
    const displayPoints = historyData.length > 0 
        ? historyData.reduce((acc, cur) => acc + Number(cur.point), 0) 
        : totalPoints;

    const monthlyGoal = 1000;
    const monthlyProgressPercentage = Math.min((displayPoints / monthlyGoal) * 100, 100);
    const currentLevel = levels.find(l => displayPoints >= l.minPoints && displayPoints < l.maxPoints) || levels[0];
    const nextLevel = levels.find(l => l.level === currentLevel.level + 1);
    const levelProgress = nextLevel
        ? ((displayPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
        : 100;

    const earnedData = historyData.filter(item => item.type === "earned");
    const usedData = historyData.filter(item => item.type === "used");

    return (
        <div className="flex w-full gap-5 h-[calc(100vh-230px)] min-h-125 overflow-hidden bg-transparent font-sans">
            {/* 왼쪽 사이드바 */}
            <div className="w-[30%] min-w-65 max-w-85 flex flex-col h-full shrink-0 overflow-hidden pb-4">
                
                {/* 1. 유저 프로필 카드 */}
                <Card className="bg-white p-4 rounded-[22px] shadow-sm shrink-0 border border-gray-100">
                    <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold uppercase tracking-widest">내 프로필</span>
                        <span className="font-bold text-black bg-gray-50 px-2 py-0.5 rounded-full border border-blue-100/50">
                            {currentLevel.name} Lv.{currentLevel.level}
                        </span>
                    </div>

                    <div className="flex flex-col items-center py-1.5">
                        <div className="relative ">
                            <img src={member?.MEM_IMG} alt="profile" className="w-14 h-14 rounded-full border-2 border-gray-50 shadow-md" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="text-center">
                            <p className="font-bold">현재 보유 포인트</p>
                            <div className="flex items-baseline justify-center gap-0.5">
                                <h2 className="text-3xl font-black tracking-tighter">
                                    <CountUp end={displayPoints} />
                                </h2>
                                <span className="text-gray-400 font-bold ">P</span>
                            </div>
                        </div>
                    </div>

                    {/* 레벨 진행 바 */}
                    {nextLevel && (
                        <div className="flex flex-col gap-2  bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                            <div className=" font-boldleading-none">레벨업까지</div>
                            <Progress value={levelProgress}  />
                            <p className="text-right">
                                {nextLevel.minPoints - displayPoints}P 남음
                            </p>
                        </div>
                    )}

                    {/* 업적 현황 섹션 */}
                    <div className="px-1.5  flex justify-between items-end">
                        <span className="font-bold uppercase tracking-tight">전체 업적 달성</span>
                        <div className="flex items-baseline gap-0.5">
                            <span className="font-black leading-none">{completedCount}</span>
                            <span className=" font-bold">/ {totalCount}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate("/reward/achievement")}
                        className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                    >
                        <Trophy className="w-3 h-3 text-amber-400" /> <span>내 업적 확인하기</span>
                    </button>
                </Card>

                {/* 2. 이달의 목표 카드 */}
                <Card className="p-4 bg-white shadow-sm border border-gray-100 rounded-[22px] shrink-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <div className="p-1 bg-orange-50 rounded-lg">
                            <BarChart3 className="w-3 h-3 text-orange-500" />
                        </div>
                        <h3 className="font-black">이달의 목표</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className=" font-bold">{monthlyGoal.toLocaleString()}P 목표</span>
                            <span className="font-black leading-none">{Math.round(monthlyProgressPercentage)}%</span>
                        </div>
                        <Progress value={monthlyProgressPercentage} className="h-2 bg-gray-50" />
                        <div className="p-2 bg-blue-50/50 rounded-xl border border-blue-50 text-center">
                            <p className=" text-black font-bold leading-tight">
                                {displayPoints >= monthlyGoal ? "🎉 목표 달성 완료!" : `보상 획득까지 ${monthlyGoal - displayPoints}P 남음`}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* 오른쪽 탭 리스트 영역 */}
            <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
                <Tabs defaultValue="all" className="w-full flex flex-col h-full min-h-0">
                    <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm mb-3 shrink-0 rounded-3xl p-1.5 border-0">
                        <TabsTrigger value="all" className="rounded-xl font-bold  py-1.5">전체</TabsTrigger>
                        <TabsTrigger value="earned" className="rounded-xl font-bold  py-1.5">적립 내역</TabsTrigger>
                        <TabsTrigger value="used" className="rounded-xl font-bold  py-1.5">사용 내역</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-transparent">
                        <TabsContent value="all" className="m-0 flex-1 outline-none data-[state=active]:flex flex-col min-h-0 px-1">
                            {renderHistoryList(historyData, true)}
                        </TabsContent>
                        <TabsContent value="earned" className="m-0 flex-1 outline-none data-[state=active]:flex flex-col min-h-0 px-1">
                            {renderHistoryList(earnedData, true)}
                        </TabsContent>
                        <TabsContent value="used" className="m-0 flex-1 outline-none data-[state=active]:flex flex-col min-h-0 px-1">
                            {renderHistoryList(usedData, false)}
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}

const renderHistoryList = (data: PointHistory[], showGuide: boolean = true) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return (
        <div className="flex flex-col h-full min-h-0 w-full">
            <div className="flex-1 overflow-y-auto scrollbar-hide pb-2 px-1 pt-1">
                <style dangerouslySetInnerHTML={{ __html: `.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }` }} />
                {data.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 content-start">
                        {data.map((item, idx) => (
                            <Card key={idx} className={`${format(new Date(item.wo_dt), 'yyyy-MM-dd') === todayStr ? "bg-secondary border-blue-100" : "bg-white border border-gray-100"} rounded-[14px] p-3 flex flex-col hover:shadow-sm transition-all shadow-sm`}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${item.type === 'earned' ? 'bg-amber-50' : 'bg-gray-50'}`}>
                                            {getHistoryIcon(item.img)}
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <h4 className="font-bold  text-gray-900 mb-0 leading-none">{item.title}</h4>
                                            <div className="flex items-center gap-1  text-primary text-sm mt-1">
                                                <Clock className="size-3" /> <span>{format(new Date(item.wo_dt), 'yyyy-MM-dd')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end text-right gap-1">
                                        <p className={`font-black leading-none ${item.type === 'earned' ? 'text-black' : 'text-black'}`}>
                                            {item.type === 'earned' ? `+${Number(item.point).toLocaleString()}` : `${Number(item.point).toLocaleString()}`}P
                                        </p>
                                        {item.accuracy > 0 && (
                                            <div className="flex items-center px-1.5 py-0.5 rounded mt-1 text-sm">
                                                <span className=" font-bold text-primary leading-none">정확도 {item.accuracy}%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200 min-h-37.5">
                        <HistoryIcon className="w-8 h-8 mb-2 opacity-20" />
                        <p className="font-medium">내역이 없습니다.</p>
                    </div>
                )}
            </div>

            {showGuide && (
                <Card className="shrink-0 mt-2 mx-1 p-2.5 border border-gray-100 bg-gray-50/50 rounded-[14px] shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1.5 text-gray-900 font-black px-1">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <h3 className="uppercase tracking-widest">포인트 획득 방법</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {pointEarningMethods.map((method) => (
                            <div key={method.id} className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white border border-gray-100 shadow-sm">
                                <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0 font-black text-blue-600 ">
                                    {method.id}
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h4 className=" font-bold text-gray-900 leading-none mb-0.5">{method.title}</h4>
                                    <p className=" text-gray-500 leading-tight text-sm">{method.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};