import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CircleDollarSign, LogOutIcon, SettingsIcon, UserIcon, LogIn, UserRoundPlus  } from 'lucide-react';

import { useUser } from '@/hooks/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useState } from 'react';

const WdogAvatar = () => {
  const navigate = useNavigate();
  const { member } = useUser();  // Context에서 공유
  const { refetch } = useUser();  //     
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
      await refetch();  // 헤더 즉시 업데이트      
      navigate('/'); // 로그아웃 후 홈 페이지로
    } catch (e: any) {
      setError('로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };
  // 로그인 상태: 세션 member로 Avatar 표시
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar 
          className="cursor-pointer hover:opacity-80 transition-opacity" 
        >
          <AvatarImage
            src={member?.MEM_IMG || '/member/member.png'} // 기본 이미지 경로
            alt={member?.MEM_NAME}
            className={member?.MEM_ID !== 1 ? "grayscale" : ""}
          />
          <AvatarFallback>{member?.MEM_NAME?.slice(0, 2) || 'U'}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {member ? (
          <>
            <DropdownMenuLabel className="text-sm font-semibold text-focus">내 정보</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate('/member/profile/profile')}>
              <UserIcon />
              프로필
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/member/profile/premium')}>
              <CircleDollarSign />
              구독관리
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/member/profile/setting')}>
              <SettingsIcon />
              설정
            </DropdownMenuItem>
            <DropdownMenuSeparator />          
            <DropdownMenuItem variant="destructive" onClick={handleLogout} disabled={loading}>
              <LogOutIcon />
              {loading ? '로그아웃 중...' : '로그아웃'}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={() => navigate('/member/login')}>
              <LogIn />
              로그인
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/member/signup')}>
              <UserRoundPlus />
              회원가입
            </DropdownMenuItem>   
          </>       
        )}
        {error && <div className="text-red-500">{error}</div>}
      </DropdownMenuContent>
    </DropdownMenu>    

  );
};

export default WdogAvatar;