import { useUser } from "@/hooks/UserContext";

import { Smartphone, Mail, Award, Flame } from "lucide-react";

const MemberProfileMain = () => {
    const { member } = useUser();
  return (
    <div className="max-w-2xl mx-auto p-4 animate-in fade-in duration-500">
      <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition-all">

        {/* 상단: 레벨 및 배지 */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            <Award className="text-yellow-500" size={20} />
            <span className="font-bold text-gray-800 text-lg">LV.{member?.MEM_LVL}</span>
            <span className="text-xs text-gray-400 font-normal">({member?.MEM_EXP_POINT} EXP)</span>
          </div>
          <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
            <Flame size={14} />
{/*             <span className="text-xs font-bold">{member?.MEM_STREAK}일 연속</span> */}
          </div>
        </div>

        {/* 프로필 메인 */}
        <div className="flex items-center gap-5 pb-8 border-b border-gray-100">
          <div className="relative">
            <img
              src={member?.MEM_IMG || "/member/member.png"}
              className="w-20 h-20 rounded-full bg-gray-100 object-cover ring-2 ring-gray-50"
              alt="프로필"
              onError={(e) => {
                // 실제 파일 로드에 실패하면 강제로 기본 이미지로 교체
                e.currentTarget.src = "/member/member.png";
              }}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold text-gray-900">{member?.MEM_NICKNAME}</h2>
              <span className="text-sm text-gray-500 font-medium">{member?.MEM_NAME}</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {member?.MEM_SEX} · {member?.MEM_AGE}세 · {member?.MES_NAME || "소속 없음"}
            </p>
          </div>
        </div>

        {/* 연락처 및 포인트 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <Smartphone size={16} />
              <span className="text-sm">{member?.MEM_PNUMBER || "연락처 미등록"}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Mail size={16} />
              <span className="text-sm">{member?.MEM_EMAIL || "이메일 미등록"}</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-center">
            <span className="text-xs text-gray-400 mb-1">보유 포인트</span>
            <span className="text-xl font-bold text-blue-600">
              {member?.MEM_POINT?.toLocaleString() ?? "0"} <small className="text-sm font-normal text-gray-500">P</small>
            </span>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="mt-4 flex justify-end pt-4 border-t border-gray-50">
          <button
            onClick={() => alert('회원 정보 수정 페이지로 이동')}
            className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-95 shadow-sm"
          >
            내 정보 수정
          </button>
        </div>

      </div>
    </div>
  );
};

export default MemberProfileMain;