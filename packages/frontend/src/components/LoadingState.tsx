import React from 'react';
import { Zap } from 'lucide-react';

const LoadingReport: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* 로딩 애니메이션 컨테이너 */}
      <div className="relative mb-8">
        {/* 바깥쪽 회전 원 */}
        <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        {/* 안쪽 아이콘 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-3 rounded-2xl shadow-lg">
          <Zap className="w-8 h-8 text-indigo-600 fill-indigo-100 animate-pulse" />
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="text-center">
        <h2 className="text-2xl font-black text-slate-800 mb-2">AI가 운동 결과를 분석 중입니다</h2>
        <p className="text-slate-500 font-medium animate-bounce">
          잠시만 기다려 주세요. 멋진 리포트를 만들고 있어요! 🏃‍♂️
        </p>
      </div>

      {/* 진행 상태 바 (디자인용) */}
      <div className="mt-8 w-64 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-600 animate-[loading_2s_ease-in-out_infinite] w-1/2 origin-left"></div>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default LoadingReport;