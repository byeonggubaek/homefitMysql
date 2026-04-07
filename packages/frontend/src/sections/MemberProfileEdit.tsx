import { useState } from 'react';
import axios from 'axios';
import { useUser } from "@/hooks/UserContext";
import { useNavigate } from 'react-router-dom';
import { Smartphone, Mail, Award, Flame, Camera, ArrowLeft } from "lucide-react";

const MemberProfileEdit = () => {
    // 1. refetch를 가져옵니다.
    const { member, refetch } = useUser();
    const navigate = useNavigate();

    const [nickname, setNickname] = useState(member?.MEM_NICKNAME || "");
    const [pnumber, setPnumber] = useState(member?.MEM_PNUMBER || "");
    const [imgUrl, setImgUrl] = useState(member?.MEM_IMG || "/member/member.png");

    const handleUpdate = async () => {
        try {
            const response = await axios.post(
                'http://localhost:3001/api/member/edit',
                { nickname, pnumber, img: imgUrl }, // 이미지 경로도 같이 전송
                { withCredentials: true }
            );

            if (response.data.success) {
                // 2. 🔥 핵심: 서버에 수정된 데이터를 세션에 넣었으니, 
                // 프론트엔드에서도 최신 세션 정보를 다시 한 번 읽어오라고 시킵니다.
                await refetch();

                alert('성공적으로 수정되었습니다!');
                navigate('/member/profile/main');
            }
        } catch (error) {
            console.error(error);
            alert('수정 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 animate-in slide-in-from-bottom-4 duration-500">
            {/* 헤더 부분 */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">프로필 편집</h1>
            </div>

            <div className="border border-gray-200 rounded-3xl p-8 bg-white shadow-xl">

                {/* 1. 프로필 이미지 수정 섹션 */}
                <div className="flex flex-col items-center mb-10">
                    <div className="relative group cursor-pointer">
                        <img
                            onClick={() => alert('사진 변경 기능은 현재 준비 중입니다! 👨‍💻')}
                            src={imgUrl}
                            className="w-32 h-32 rounded-full object-cover ring-4 ring-blue-50 shadow-lg group-hover:opacity-80 transition-all"
                            alt="프로필"
                        />
                        <div className="absolute bottom-0 right-0 bg-blue-600 p-2.5 rounded-full text-white shadow-md border-4 border-white">
                            <Camera size={20} />
                        </div>
                        {/* 실제 구현시 파일 업로드 input 연결 */}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">프로필 사진 변경</p>
                </div>

                {/* 2. 읽기 전용 정보 (레벨, 경험치, 포인트) */}
                <div className="grid grid-cols-3 gap-4 mb-10 pb-8 border-b border-gray-100">
                    <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Level</p>
                        <div className="flex items-center justify-center gap-1 text-blue-600">
                            <Award size={14} />
                            <span className="font-bold">LV.{member?.MEM_LVL}</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Streak</p>
                        <div className="flex items-center justify-center gap-1 text-orange-500">
                            <Flame size={14} />
                            <span className="font-bold">{member?.MEM_STREAK}일</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Points</p>
                        <span className="font-bold text-gray-800">{member?.MEM_POINT?.toLocaleString()}P</span>
                    </div>
                </div>

                {/* 3. 수정 입력 폼 */}
                <div className="space-y-6">
                    <div className="group">
                        <label className="text-xs font-bold text-gray-400 mb-2 block group-focus-within:text-blue-600 transition-colors">닉네임</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                            placeholder="닉네임을 입력하세요"
                        />
                    </div>

                    <div className="group">
                        <label className="text-xs font-bold text-gray-400 mb-2 block group-focus-within:text-blue-600 transition-colors">연락처</label>
                        <div className="relative">
                            <Smartphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={pnumber}
                                onChange={(e) => setPnumber(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                                placeholder="010-0000-0000"
                            />
                        </div>
                    </div>

                    <div className="group">
                        <label className="text-xs font-bold text-gray-400 mb-2 block opacity-60">이메일 (수정 불가)</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input
                                type="text"
                                value={member?.MEM_EMAIL || ""}
                                disabled
                                className="w-full pl-12 pr-4 py-3 bg-gray-100 border-none rounded-xl text-gray-400 cursor-not-allowed font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* 4. 하단 버튼 */}
                <div className="mt-10 flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleUpdate}
                        className="flex-1 py-4 bg-[#718486] text-white rounded-2xl font-bold hover:bg-[#5a6b6d] shadow-lg shadow-[#5a6b6d] transition-all active:scale-95"
                    >
                        변경사항 저장
                    </button>
                </div>

            </div>
        </div>
    );
};

export default MemberProfileEdit;