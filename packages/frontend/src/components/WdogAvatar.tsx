import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/hooks/UserContext';
import { useNavigate } from 'react-router-dom';

const WdogAvatar = () => {
  const navigate = useNavigate();
  const { member, loading } = useUser();  // Context에서 공유

  const handleAvatarClick = () => {
    if (!loading && !member) {
      navigate('/member/login');
    }
    else {
      navigate('/member/logout');
    }
  };
  // 로그인 상태: 세션 member로 Avatar 표시
  return (
    <Avatar 
      className="cursor-pointer hover:opacity-80 transition-opacity" 
      onClick={handleAvatarClick}
    >
      <AvatarImage
        src={member?.MEM_IMG}
        alt={member?.MEM_NAME}
        className={member?.MEM_ID === "MES00001" ? "grayscale" : ""}
      />
      <AvatarFallback>{member?.MEM_NAME?.slice(0, 2) || 'U'}</AvatarFallback>
    </Avatar>
  );
};

export default WdogAvatar;