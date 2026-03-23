import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Member } from 'shared';

interface WdogAvatarProps {
  memberID: string;
}
const WdogAvatar = (props: WdogAvatarProps) => 
{
  const navigate = useNavigate();    
  // 카운트 상태를 관리합니다.
   const [member, setMember] = useState<Member | null>(null);
   let memberID = props.memberID; // 예시 회원 ID
   useEffect(() => {
    if (memberID) {   
      // 회원 정보 조회
      fetch(`http://localhost:3001/api/get_member?memberId=${memberID}`)
        .then(res => res.json())
        .then(data => {
          setMember(data.data); 
      });    
    }
   }, [memberID]); // memberID가 변경될 때마다 회원 정보를 다시 조회합니다.
  const handleAvatarClick = () => {
    if(!memberID) {
        navigate('/member/login');     // 이동
    }
  } 
  return (
    <Avatar className="cursor-pointer hover:opacity-80 transition-opacity"  onClick={handleAvatarClick} >
        <AvatarImage
        src={member?.img}
        alt={member?.name}
        className={member ? "" : "grayscale"}
        />
        <AvatarFallback>{member?.name || ""}</AvatarFallback>
    </Avatar>
  );
};

export default WdogAvatar;