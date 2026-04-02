import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MemberPwCheck = () => {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleVerify = async () => {
    console.log("보내는 비번:", password);
    try {
      const response = await axios.post(
        'http://localhost:3001/api/member/pwcheck', 
        { password },
        { withCredentials: true } // 세션 쿠키 전송 필수
      );

      if (response.data.success) {
        // 성공 시 수정 페이지로 이동
        navigate('/member/edit');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || '비밀번호가 일치하지 않습니다.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white border rounded-2xl shadow-sm">
      <h2 className="text-xl font-bold mb-4">비밀번호 확인</h2>
      <input
        type="password"
        className="w-full p-3 border rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="현재 비밀번호를 입력하세요"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={handleVerify}
        className="w-full py-3 bg-[#718486] text-white rounded-lg font-bold hover:bg-[#5a6b6d] transition-colors"
      >
        확인
      </button>
    </div>
  );
};

export default MemberPwCheck;