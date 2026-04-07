import { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  CheckCircle2, Loader2, Plus, Trash2, X, Dumbbell
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/hooks/UserContext';


const MemberPlansCalendar = () => {
  const { member } = useUser();

  // =========================================================================
  // 1. 상태 관리 (State)
  // =========================================================================
  // 데이터 상태
  const [plans, setPlans] = useState<any[]>([]);          // 특정 날짜의 운동 계획 리스트
  const [workoutList, setWorkoutList] = useState<any[]>([]);// DB에서 가져온 전체 운동 목록

  // UI 상태
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 날짜 상태
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 모달 입력 상태
  const [selectedWooId, setSelectedWooId] = useState(''); // 선택된 운동 ID

  const [targetReps, setTargetReps] = useState(''); // 목표 반복 수
  const [targetSets, setTargetSets] = useState(''); // 목표 세트 수

  // =========================================================================
  // 2. 날짜 헬퍼 함수
  // =========================================================================
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const startDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const lastDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const [monthStatus, setMonthStatus] = useState<any[]>([])
  // =========================================================================
  // 3. DB API 연동 (핵심)
  // =========================================================================

  // [1] 컴포넌트 켜질 때 딱 한 번! DB에서 전체 운동 목록 가져오기
  const loadWorkoutList = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/workout/getWorkouts');
      if (res.data.success && res.data.data.length > 0) {
        setWorkoutList(res.data.data);
        setSelectedWooId(res.data.data[0].WOO_ID);
      }
    } catch (err) {
      console.error("운동 목록 로드 실패:", err);
    }
  };

  useEffect(() => {
    loadWorkoutList();
  }, []);

  // [2] 달력 날짜를 누를 때마다 해당 날짜의 운동 계획 가져오기
  const loadPlans = useCallback(async () => {
    if (!member?.MEM_ID) return;

    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:3001/api/member/getMemberPlan`, {
        params: { memberId: member.MEM_ID, date: formatDate(selectedDate) }
      });
      if (res.data.success) {
        console.log("로드된 계획들:", res.data.data);
        setPlans(res.data.data);
      }
    } catch (err) {
      console.error("일정 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, member?.MEM_ID]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // [3] 새로운 목표 DB에 저장하기
  const handleSave = async () => {
    if (!member?.MEM_ID) {
      alert("로그인 정보가 없습니다.");
      return;
    }
    if (!targetReps || !targetSets) {
      alert("목표 수치를 입력해주세요.");
      return;
    }
    if (!selectedWooId) {
      alert("운동을 선택해주세요."); // 👈 십중팔구 여기서 걸릴 겁니다!
      return;
    }
    const selectedWorkoutObj = workoutList.find(w => w.WOO_ID === Number(selectedWooId));
    if (!selectedWorkoutObj) {
      alert("해당 운동 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      const newPlan = {
        MEM_ID: member.MEM_ID,
        WOO_ID: Number(selectedWooId),
        MEP_DATE: formatDate(selectedDate),
        MEP_TARGET_REPS: Number(targetReps),
        MEP_TARGET_SETS: Number(targetSets),
        MEP_UNIT: selectedWorkoutObj.WOO_UNIT
      };

      const res = await axios.post('http://localhost:3001/api/member/insertMemberPlan', newPlan);
      if (res.data.success) {
        setIsModalOpen(false);
        setTargetReps('');
        setTargetSets('');
        loadPlans();
      }
    } catch (err) {
      console.error("저장 실패:", err);
      alert("저장 중 오류가 발생했습니다.");
    }
  };
  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  // 현재 선택된 운동의 단위 표시용
  const currentUnit = workoutList.find(w => w.WOO_ID === Number(selectedWooId))?.WOO_UNIT || '회';

  // [4] 운동 계획 삭제하기
  const handleDelete = async (MEP_ID: number) => {
    // 실수로 지우는 걸 방지하기 위해 한 번 물어봅니다.
    if (!window.confirm("이 운동 계획을 삭제하시겠습니까?")) return;

    try {
      // 🚨 백엔드 index.ts 에서 설정한 경로 /api/member/deleteMemberPlan/:goalId 로 요청을 보냅니다.
      const res = await axios.delete(`http://localhost:3001/api/member/deleteMemberPlan?goalId=${MEP_ID}`);

      if (res.data.success) {
        // ✅ 삭제 성공 시 화면을 새로고침합니다.
        loadPlans();        // 우측 리스트 새로고침
        loadMonthStatus();  // 달력 동그라미 새로고침
      }
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };
  const loadMonthStatus = useCallback(async () => {
    if (!member?.MEM_ID) return;
    try {
      // "2026-03" 형태로 잘라서 보냅니다.
      const yearMonth = formatDate(viewDate).substring(0, 7);

      const res = await axios.get(`http://localhost:3001/api/member/getMonthlyMemberPlan`, {
        params: { memberId: member.MEM_ID, month: yearMonth }
      });

      if (res.data.success) {
        setMonthStatus(res.data.data);
      }
    } catch (err) {
      console.error("월간 요약 로드 실패:", err);
    }
  }, [viewDate, member?.MEM_ID]);

  // 3. 달을 넘길 때마다 데이터를 다시 불러오는 useEffect
  useEffect(() => {
    loadMonthStatus();
  }, [loadMonthStatus]);

  // =========================================================================
  // 4. 화면 렌더링
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6 pb-20">

      {/* ---------------- [ 좌측: 달력 영역 ] ---------------- */}
      <div className="lg:col-span-2 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm h-fit">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
              <CalendarIcon size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
            </h2>
          </div>
          <div className="flex gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-100">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-full text-slate-500 transition-all"><ChevronLeft size={20} /></button>
            <button onClick={() => setViewDate(new Date())} className="px-5 py-2 text-sm font-bold text-indigo-600 bg-white shadow-sm rounded-full transition-all">오늘</button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-full text-slate-500 transition-all"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-4 gap-x-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-bold text-slate-400 pb-2">{day}</div>
          ))}
          {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: lastDate }).map((_, i) => {
            const dateNum = i + 1;
            const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), dateNum);
            const isSelected = formatDate(selectedDate) === formatDate(cellDate);
            const isToday = formatDate(new Date()) === formatDate(cellDate);
            const dateStr = formatDate(cellDate); // "2026-03-30"

            // 💡 DB에서 온 날짜 문자열 앞 10자리만 잘라서 정확히 비교!
            const status = monthStatus.find(s => {
              if (!s.MEP_DATE) return false;

              // 단순 문자열 자르기가 아니라, Date 객체로 만든 뒤 기존 formatDate 함수를 태웁니다.
              const dbDate = formatDate(new Date(s.MEP_DATE));
              return dbDate === dateStr;
            });

            // 💡 DB에서 온 COUNT 값들이 문자형일 수 있으므로 Number()로 확실하게 숫자로 바꿈!
            const total = Number(status?.TOTAL_COUNT || 0);
            const done = Number(status?.DONE_COUNT || 0);

            const hasPlan = total > 0;
            const isAllDone = hasPlan && total === done;
            const isPending = hasPlan && total > done;

            return (
              <div
                key={dateNum}
                onClick={() => setSelectedDate(cellDate)}
                className={`
        relative aspect-square flex flex-col items-center justify-center rounded-2xl text-base font-bold cursor-pointer transition-all duration-200
        ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' : 'hover:bg-slate-50 text-slate-700'}
        ${isToday && !isSelected ? 'text-indigo-600 border-2 border-indigo-100' : ''}
      `}
              >
                <span>{dateNum}</span>

                {/* 📍 상태 표시 동그라미 */}
                <div className="absolute bottom-2 flex gap-1">
                  {isAllDone && (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="완료" />
                  )}
                  {isPending && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" title="진행중" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------- [ 우측: 일별 계획 영역 ] ---------------- */}
      <div className="bg-slate-50 rounded-[32px] p-8 flex flex-col h-full min-h-[500px]">
        <div className="mb-6">
          <p className="text-indigo-500 text-sm font-bold mb-1 tracking-tight">DAILY PLAN</p>
          <h2 className="text-2xl font-black text-slate-800">
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
          </h2>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-400" size={32} /></div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
              <Dumbbell size={48} className="text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold">등록된 일정이 없습니다</p>
              <p className="text-slate-400 text-sm mt-1">하단 버튼을 눌러 일정을 추가해보세요.</p>
            </div>
          ) : (
            plans.map((plan) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                key={plan.MEP_ID}
                className="p-5 rounded-2xl bg-white shadow-sm border border-slate-100 group flex items-center justify-between hover:border-indigo-200 transition-all"
              >

                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${plan.MEP_ACHIEVED === 'Y' ? 'bg-green-50' : 'bg-indigo-50'}`}>
                    {plan.WOO_IMG ? (
                      <img
                        src={plan.WOO_IMG}
                        alt={plan.WOO_NAME}
                        className="w-8 h-8 object-contain drop-shadow-sm"
                      />
                    ) : (
                      /* 이미지가 없을 때를 대비한 예비용(기존 글자) */
                      <span className={`font-black text-lg ${plan.MEP_ACHIEVED === 'Y' ? 'text-green-500' : 'text-indigo-600'}`}>
                        {plan.WOO_NAME ? plan.WOO_NAME.substring(0, 1) : 'W'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-base font-black text-slate-800">{plan.WOO_NAME}</div>
                    <div className="text-sm text-slate-500 font-bold mt-0.5">
                      목표: {plan.MEP_TARGET_SETS} 세트 {plan.MEP_TARGET_REPS} {plan.MEP_UNIT}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {plan.MEP_ACHIEVED === 'Y' && <CheckCircle2 className="text-green-500" size={24} />}
                  <button onClick={() => handleDelete(plan.MEP_ID)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-base hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={20} /> 새 목표 추가하기
        </button>
      </div>

      {/* ---------------- [ 모달: 운동 등록 팝업 ] ---------------- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black text-slate-900">새 목표 설정</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                {/* 1. 운동 선택 (DB 데이터 연동) */}
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wider">운동 선택</label>
                  <select
                    value={selectedWooId}
                    onChange={(e) => setSelectedWooId(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                  >
                    {workoutList.map(workout => (
                      <option key={workout.WOO_ID} value={workout.WOO_ID}>
                        {workout.WOO_NAME}
                      </option>
                    ))}
                  </select>
                </div>

                    {/* 날짜 선택 */}
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wider">날짜 </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formatDate(selectedDate)}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>

                </div>

                {/* 세트 수 */}
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wider">세트 </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={targetSets}
                      onChange={(e) => setTargetSets(e.target.value)}
                      placeholder="몇 세트 하실건가요?"
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                    <span className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 font-bold ">
                      세트
                    </span>
                  </div>
                </div>

                {/* 2. 목표 수치 입력 (단위 자동 연동) */}
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wider">횟수</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={targetReps}
                      onChange={(e) => setTargetReps(e.target.value)}
                      placeholder="몇 회 하실건가요?"
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                    <span className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 font-bold ">
                      {currentUnit}
                    </span>
                  </div>
                </div>


                <button onClick={handleSave} className="w-full py-4 mt-4 bg-indigo-600 text-white rounded-2xl font-black text-base hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                  저장 완료
                </button>
              </div>
            </motion.div>
          </div>
        )
        }
      </AnimatePresence >

    </div >
  );
};

export default MemberPlansCalendar;