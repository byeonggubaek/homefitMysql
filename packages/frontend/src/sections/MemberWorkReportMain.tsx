import React, { useEffect, useState, useCallback, useRef } from 'react';
import { toPng } from 'html-to-image';
import { TrendingUp, Zap, Star, Activity, Download} from 'lucide-react';
import { useUser } from "@/hooks/UserContext";
import type { WorkoutDetail } from 'shared';
import { Spinner } from "@/components/ui/spinner"
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import jsPDF from 'jspdf';

const MemberWorkReportMain: React.FC = () => {
  const { member } = useUser();
  const reportRef = useRef<HTMLDivElement>(null);

  const [wor_id, setWorId] = useState<string | null>(null);
  const [wor_id_view, setWorIdView] = useState<string | null>(null);
 
  const [exercises, setExercises] = useState<WorkoutDetail[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFullReport = useCallback(async () => {
    if (!member || !member.MEM_ID) return;
    setIsLoading(true);
    try {
      fetch(`http://localhost:3001/api/workout/getLatestFinishedWorkoutId?mem_id=${member.MEM_ID}`)
        .then(res => res.json())
        .then(data => {
          setWorId(data.data.WOR_ID);  
          setWorIdView(data.data.WOR_ID_VIEW);
        });
      if (!wor_id) {
        return setIsLoading(false);
      }
      const resDetail = await fetch(`http://localhost:3001/api/workout/getWorkoutDetails?wor_id=${wor_id}&mem_id=${member.MEM_ID}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const detailData = await resDetail.json();
      if (detailData.success && detailData.data.length > 0) {
        setExercises(detailData.data);

        const resAi = await fetch('http://localhost:3001/api/member/analyzeWorkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ MEM_ID: member.MEM_ID, WOR_ID: wor_id })
        });
        const aiData = await resAi.json();
        console.log("AI 분석 결과:", aiData);
        if (aiData.success) setAiAnalysis(aiData.data);
      }
    } catch (error) {
      console.error("데이터 연동 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [wor_id, member?.MEM_ID]);

  useEffect(() => { fetchFullReport(); }, [fetchFullReport]);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        backgroundColor: '#fcfcfd',
        width: 1200,
        style: { width: '1200px', margin: '0', padding: '40px', maxWidth: 'none' }
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(dataUrl);
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = (imgProps.height * contentWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', margin, margin, contentWidth, contentHeight);
      pdf.save(`${member?.MEM_NICKNAME}_HomeFit_리포트.pdf`);
    } catch (error) { console.error("PDF 생성 실패:", error); }
  };

  const totalPoint = exercises.reduce((sum, ex) => sum + (Number(ex.WOD_POINT) || 0), 0);
  const totalTime = exercises.reduce((sum, ex) => sum + (Number(ex.WOD_TIME) || 0), 0);
  const avgAccuracy = exercises.length > 0
    ? Math.floor(exercises.reduce((sum, ex) => sum + (Number(ex.WOD_ACCURACY) || 0), 0) / exercises.length)
    : 0;

  const chartData = exercises.map(ex => ({
    name: ex.WOO_NAME,
    accuracy: Number(ex.WOD_ACCURACY) || 0
  }));

  const radarData = ['상체', '하체', '코어', '유산소', '전신'].map(part => {
    const filtered = exercises.filter(ex => ex.WOO_TYPE?.trim() === part);
    const partAvg = filtered.length > 0
      ? filtered.reduce((sum, ex) => sum + (Number(ex.WOD_ACCURACY) || 0), 0) / filtered.length
      : 0;
    return { subject: part, A: Math.floor(partAvg), fullMark: 100 };
  });

  return (
    <div className="bg-[#fcfcfd] min-h-screen pb-24 font-sans text-slate-900 tracking-tight">
      <div ref={reportRef} className="max-w-6xl mx-auto pt-16 px-8 bg-[#fcfcfd]"> 

        {/* 헤더 섹션 */}
        <div className="flex justify-between items-start mb-5 border-b pb-5 border-primary/20">
          <div className="space-y-4">
            <div className="font-bold uppercase text-xl">
              HomeFit 인공지능 분석 리포트 {wor_id ? `: ${wor_id_view}` : ''}
            </div>
            <h1 className="flex items-center text-4xl font-extrabold text-slate-900">
              {member?.MEM_NICKNAME}님의 &nbsp;<span className="text-slate-500 font-medium">운동 분석</span> 
              {isLoading && <Spinner className="text-focus w-10 h-10 ml-4" />}
            </h1>
            <div className="flex items-center space-x-6">
              <div className="flex items-center text-[#10B981] text-sm font-bold bg-[#ECFDF5] px-5 py-2.5 rounded-2xl shadow-sm border border-[#D1FAE5]">
                <Star className="w-4 h-4 mr-2 fill-current" />
                <span>상위 {aiAnalysis?.RANK_PERCENT || 0}% 의 고득점자입니다!</span>
              </div>

            </div>
          </div>
          <div className="mt-8 md:mt-0 flex flex-col items-end space-y-6">
            <div>
              <button onClick={handleDownloadPDF} className="
                flex items-center 
                text-focus rounded-lg p-1 cursor-pointer object-contain
                active:bg-focus 
                active:text-white
                hover:animate-heartbeat 
                hover:scale-120 
                hover:ring-2 
                hover:primary 
                ">
                <Download className="w-4 h-4 mr-1" /> PDF 저장하기
              </button>                 
            </div>             
            <p className="text-sm uppercase mb-2">추천 운동 강도</p>
            <p className="text-3xl font-light tracking-tighter">
              {aiAnalysis?.NEXT_INTENSITY || '보통'}
            </p>
          </div>
        </div>

        {/* AI 피드백 카드 */}
        <div className="relative mb-5 group">
          <div className="absolute -inset-2 bg-emerald-100 rounded-[3rem] blur-3xl opacity-20" />
          <div className="relative bg-white rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-slate-200 p-5">
            <div className="max-w-5xl">
              <h3 className="font-bold uppercase mb-4 flex items-center tracking-widest">
                <Zap className="w-4 h-4 mr-2 text-[#10B981] fill-current" /> AI 코치 피드백
              </h3>
              <p className="text-xl md:text-2xl font-semibold text-slate-800 mb-6 leading-[1.8] break-keep border-l-2 border-secondary pl-4">
                {aiAnalysis?.SUMMARY || "오늘의 운동 데이터를 분석하고 있습니다."}
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 border-t border-slate-200 pt-6">
                <div className="pl-4 border-l-2 border-secondary">
                  <h4 className="font-bold uppercase tracking-[0.2em] border-b border-slate-50 pb-2 mb-4">전문 코칭 제안</h4>
                  <div >
                    {aiAnalysis?.RECOMMENDATIONS?.map((rec: string, i: number) => (
                      <div key={i} className="flex items-start h-18">
                        <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full mr-4 mt-2.5 shrink-0" />
                        <span className="text-slate-600 font-medium text-base leading-relaxed">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pl-4 border-l-2 border-secondary">
                  <h4 className="font-bold uppercase tracking-[0.2em] border-b border-slate-50 pb-2 mb-4">오늘의 수행 상태</h4>
                  <div>
                    {exercises.length > 0 ? exercises.map((item: any, i: number) => (
                      <div key={i} className="flex items-between h-18">
                        <div className="pr-4 w-full">
                          <p className="font-bold text-slate-800 text-base">{item.WOO_NAME}</p>
                          <p className="text-sm mt-1.5 font-medium italic">{item.WOD_ACCURACY}% 정확도</p>
                        </div>
                        <div className="flex items-start justify-end">
                          {/* 💡 모던 에메랄드 배지 적용 */}
                          <span className={`font-bold h-7 w-24 flex items-center justify-center rounded-md shrink-0 ml-4 transition-colors ${
                            item.WOD_ACCURACY >= 90 
                              ? 'bg-[#064E3B] text-white border-[#064E3B]' 
                              : item.WOD_ACCURACY >= 80 
                                ? 'bg-[#ECFDF5] text-[#10B981] border-[#D1FAE5]' 
                                : 'bg-[#F8FAFC] text-[#94A3B8] border-[#E2E8F0]'
                          }`}>
                            {item.WOD_ACCURACY >= 90 ? '완벽' : item.WOD_ACCURACY >= 80 ? '우수' : '개선 필요'}
                          </span>
                        </div>
                      </div>
                    )) : (
                      <div className="py-10 text-center text-slate-400 text-sm">오늘 수행한 운동이 없습니다.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-5">
          <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm h-105">
            <h3 className="text-slate-900 font-bold uppercase tracking-widest mb-10 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-[#10B981]" /> 정확도 분석 추이
            </h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={15} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.accuracy >= 90 ? '#064E3B' : entry.accuracy >= 80 ? '#10B981' : '#94A3B8'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm h-105 flex flex-col">
            <h3 className="text-slate-900 font-bold uppercase tracking-widest mb-10 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-slate-800" /> 신체 밸런스 지표
            </h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name={member?.MEM_NICKNAME} dataKey="A" stroke="#064E3B" fill="#10B981" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 하단 요약 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#064E3B] p-5 rounded-3xl text-white shadow-xl flex flex-col justify-between h-38.75">
            <p className="text-emerald-200 font-bold uppercase tracking-widest">누적 획득 포인트</p>
            <p className="text-4xl font-bold">+{totalPoint}<span className="text-sm ml-1 text-emerald-300/50 font-medium">P</span></p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-38.75">
            <p className="text-slate-400 font-bold uppercase tracking-widest">오늘의 총 운동 시간</p>
            <p className="text-4xl font-bold text-slate-900">{totalTime}<span className="text-sm ml-1 text-slate-400 font-medium">분</span></p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-38.75">
            <p className="text-slate-400 font-bold uppercase tracking-widest">평균 수행 정확도</p>
            <p className="text-4xl font-bold text-slate-900">{avgAccuracy}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberWorkReportMain;