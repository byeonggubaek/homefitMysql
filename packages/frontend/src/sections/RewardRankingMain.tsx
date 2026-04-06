import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { Medal } from 'lucide-react';

const now = new Date();
const from_dt = startOfMonth(now);
const to_dt = endOfMonth(now);

// 등수별 설정 (기존 유지)
const sizeByRank: Record<number, string> = { 1: "h-32 w-32", 2: "h-28 w-28", 3: "h-24 w-24", 4: "h-20 w-20", 5: "h-[4.5rem] w-[4.5rem]" }
const fallbackTextByRank: Record<number, string> = { 1: "text-3xl", 2: "text-2xl", 3: "text-xl", 4: "text-lg", 5: "text-base" }
const gaugeMetaByRank: Record<number, { fill: number; duration: number }> = {
  1: { fill: 100, duration: 1.2 },
  2: { fill: 80, duration: 1.5 },
  3: { fill: 80, duration: 1.8 },
  4: { fill: 70, duration: 2.1 },
  5: { fill: 60, duration: 2.4 },
}

const RewardRankingMain = () => {
  const [rankingData, setRankingData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`http://localhost:3001/api/reward/getRanking?from_dt=${format(from_dt, 'yyyy-MM-dd')}&to_dt=${format(to_dt, 'yyyy-MM-dd')}`)
      .then(res => res.json())
      .then(data => setRankingData(data.data || []));
  }, []);

  return (
    <>
      <style>{`
        /* 1. 게이지가 왼쪽에서 차오르는 애니메이션 */
        @keyframes gauge-grow {
          0% { width: 0%; }
          100% { width: var(--fill); }
        }

        /* 2. 러너가 왼쪽(이름 옆)에서 오른쪽으로 달리는 애니메이션 */
        @keyframes runner-run {
          0% { 
            left: 0%; 
            transform: translate(0, -50%); 
          }
          100% { 
            /* 아이콘의 머리(오른쪽 끝)가 게이지 끝에 딱 닿도록 설정 */
            left: var(--fill); 
            transform: translate(-100%, -50%); 
          }
        }

        .animate-gauge {
          animation: gauge-grow var(--duration) ease-out forwards;
        }

        .animate-runner {
          animation: runner-run var(--duration) ease-out forwards;
        }
      `}</style>
      <div className="flex justify-center gap-6 w-full">
        <div className="w-3/5">
          <Card className="w-full  bg-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-4xl font-bold text-[#02899B]">운동 기록 순위</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex w-full flex-col gap-5">
                {rankingData.map((user) => {
                  const gauge = gaugeMetaByRank[user.RANK] || { fill: 50, duration: 2 };
                  const isTop3 = user.RANK <= 3;

                  return (
                    <div key={user.RANK} className="flex w-full items-center rounded-3xl bg-white px-6 py-5 shadow-md transition-all hover:shadow-xl">
                      {/* 왼쪽 프로필 영역 */}
                      <div className="flex shrink-0 items-center gap-6 sm:gap-8">
                        <div className={`w-16 text-right text-2xl font-bold ${user.RANK === 1 ? "text-[#02899B]" : "text-[#79C7C1]"}`}>
                          #{user.RANK}
                        </div>
                        <Avatar className={`${sizeByRank[user.RANK]} shrink-0`}>
                          <AvatarImage src={user.MEM_IMG} />
                          <AvatarFallback className={fallbackTextByRank[user.RANK]}>{user.MEM_NAME}</AvatarFallback>
                        </Avatar>
                        <div className="w-28 shrink-0 text-left">
                          <p className={`text-2xl font-semibold ${isTop3 ? "text-[#02899B]" : "text-gray-700"}`}>{user.MEM_NAME}</p>
                          <p className="text-lg text-gray-400">{user.CNT}회</p>
                        </div>
                      </div>

                      {/* 게이지 바 영역 (이름 바로 옆 ml-4로 간격 조절) */}
                      <div className="relative ml-4 h-14 flex-1 rounded-full bg-[#EAF7F6] shadow-inner overflow-visible"
                          style={{ "--fill": `${gauge.fill}%`, "--duration": `${gauge.duration}s` } as React.CSSProperties}>
                        
                        {/* 게이지 실제 채워지는 부분 */}
                        <div className={`animate-gauge absolute left-0 top-0 h-full rounded-full ${
                          user.RANK === 1 ? "bg-[#02899B]" : user.RANK <= 3 ? "bg-[#49B7B3]" : "bg-[#79C7C1]"
                        }`} />

                        {/* 러너 아이콘: 왼쪽에서 튀어나와서 달림 */}
                        <div className="animate-runner absolute top-1/2 z-20 w-12 h-12 flex items-center justify-center">
                          <img 
                            src="/workout/running.gif" 
                            alt="Runner" 
    className="w-full h-full rounded-full object-contain bg-white/80 backdrop-blur-sm border-2 border-secondary shadow-2xl " 
                          />
                        </div>

                        {/* 광택 효과 */}
                        <div className="absolute inset-0 rounded-full bg-linear-to-r from-white/20 to-transparent pointer-events-none" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="w-2/6">
          <Card className="w-full bg-white shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-4xl font-bold text-[#02899B] gap-4">
                  <Medal size={32}/> 이번 달의 챔피언
                </CardTitle>
              </CardHeader>
              <CardContent className="px-10">
                <div className="flex flex-col text-2xl pb-5 gap-4">
                  <div>
                    축하 합니다!
                  </div>
                  <div>
                    이번 달의 챔피언은 <span className="font-bold text-[#02899B]">{rankingData[0]?.MEM_NAME || "아직 결정되지 않음"}</span>님입니다!
                  </div>
                </div>
                <img src="/member/rank.png" alt="랭킹 이미지" />
              </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default RewardRankingMain;