import { useUser } from '@/hooks/UserContext';
import axios from 'axios';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MemberLogoutMain = () => {
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

  return (
    <div className="border rounded-lg flex min-h-[66.66dvh] bg-white font-sans text-slate-900 py-5">
      {/* 왼쪽 섹션: 타이틀 및 안내 */}
      <div className="flex w-120 flex-col justify-between border-r border-gray-200 p-12">
        <div>
          <div className="text-5xl font-black leading-tight tracking-tighter">
            로그아웃 
          </div>
        </div>
    
        <div className="space-y-15">
          <div className="space-y-2">
            <p className="text-lg  leading-snug">
              현재 계정에서 로그아웃 하시겠습니까?
            </p>
          </div>
          <IconBox Icon={LogOut} label="로그아웃" color="primary" variant="filled" onClick={handleLogout}/>
          {error && (
            <p className="text-sm text-red-500 mb-4">
              {error}
            </p>
          )}          
        </div>

        {/* 하단 브랜드 로고 영역 */}
        <div className="flex items-center gap-2 text-primary">
          <div className="h-6 w-6 fill-current">
             <ShieldCheck size={24} />
          </div>
          <span className="text-xl font-black tracking-tighter italic">HomeFit</span>
        </div>
      </div>

      {/* 오른쪽 섹션: 아이콘 그리드 레이아웃 */}
      <div className="flex w-full items-center justify-center p-5">
        <div className="w-full flex flex-col gap-x-20 gap-y-10">
            <div className="flex text-primary justify-start text-2xl tracking-wide">로그아웃</div>
            <div className="flex text-primary justify-end text-2xl tracking-wide">Logout</div>
            <div className="flex text-primary justify-start text-2xl tracking-wide">退出登录</div>
            <div className="flex text-primary justify-end text-2xl tracking-wide">ログアウト</div>
            <div className="flex text-primary justify-start text-2xl tracking-wide">Đăng xuất</div>      
            <div className="flex text-primary justify-end text-2xl tracking-wide">Déconnexion</div>
        </div>
      </div>
    </div>
  );
};

// 아이콘 개별 아이템 컴포넌트
interface IconBoxProps {
  Icon: React.ElementType;
  label: string;
  color: string;
  variant: string;
  onClick?: () => void;
}

const IconBox = ({ Icon, label, color, variant, onClick }: IconBoxProps) => (
  <div className="flex flex-col items-center gap-4">
    <div 
      className={`flex h-24 w-24 items-center justify-center rounded-2xl ${variant === 'filled' ? 'bg-warning text-white' : 'text-black'}`}
      style={variant !== 'filled' ? { color: color } : {}}
      onClick={onClick}
    >
      <Icon size={48} strokeWidth={2.5} />
    </div>
    <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">{label}</span>
  </div>
);

export default MemberLogoutMain;