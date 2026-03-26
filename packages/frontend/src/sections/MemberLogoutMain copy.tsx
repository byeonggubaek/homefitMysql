// src/pages/LogoutPage.tsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/UserContext';

export default function MemberLogoutMain() {
  const { refetch } = useUser();  //     
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(
        'http://localhost:3001/api/member/logout',
        {},
        { withCredentials: true }
      );
      console.log('로그아웃 성공');
      await refetch();  // 헤더 즉시 업데이트      
      navigate('/'); // 로그아웃 후 홈 페이지로
    } catch (e: any) {
      console.error('로그아웃 실패:', e);
      setError('로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 페이지 들어오면 자동 로그아웃 시키고 싶으면:
  // useEffect(() => { handleLogout(); }, []);

  return (
    <div className="flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-4">로그아웃</h1>
        <p className="text-slate-600 mb-6">
          현재 계정에서 로그아웃 하시겠습니까?
        </p>

        {error && (
          <p className="text-sm text-red-500 mb-4">
            {error}
          </p>
        )}

        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-red-500 text-white font-semibold
                     hover:bg-red-600 disabled:opacity-60 transition-colors"
        >
          {loading ? '로그아웃 중...' : '로그아웃'}
        </button>

        <button
          onClick={() => navigate(-1)}
          className="mt-3 w-full py-2.5 rounded-xl border border-slate-300 text-slate-700
                     hover:bg-slate-50 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
}