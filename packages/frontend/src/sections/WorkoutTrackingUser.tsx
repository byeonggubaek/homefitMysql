import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator";
import { UserRoundPlus  } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Member } from "shared";

const WorkoutTrackingUser = () => {
   const [member, setMember] = useState<Member | null>(null);
   const mem_join_id = 1; // 예시 회원 ID
   useEffect(() => {
     // 회원 정보 조회
     fetch(`http://localhost:3001/api/get_member?mem_join_id=${mem_join_id}`)
       .then(res => res.json())
       .then(data => {
         setMember(data.data); 
     });    
   }, []);    

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-3xl text-primary">회원정보 : {member?.mem_lvl} <span className="text-primary">Lvl</span> </CardTitle>
        <CardAction className="flex items-center gap-2">
          {member?.mes_name === 'V' && <><UserRoundPlus /><Link className="text-md text-focus" to="/member/register">회원가입</Link> </>}
        </CardAction>      
      </CardHeader>
      <CardContent>
        <div className="flex gap-8 text-lg">
          <div>
            <Avatar className="h-32 w-32">
              <AvatarImage
                src={member?.mem_img}
                alt={member?.mem_name}
                className={member?.mes_id === 'MES0000F' ? "grayscale" : ""}            
              />
              <AvatarFallback>사용자</AvatarFallback>
              <AvatarBadge className="w-3 h-3 border-2 border-background bg-green-600 dark:bg-green-800" />         
            </Avatar>
          </div>
          <div>
              <div> ID : <span className="text-primary">{member?.mem_id}</span></div>
              <div> 이름 : <span className="text-primary">{member?.mem_name}</span></div>
              <div> 나이 : <span className="text-primary">{member?.mem_age}세</span></div>
              <div> 성별 : <span className="text-primary">{member?.mem_sex}</span></div>
          </div> 
        </div>
        <Separator />        
        <div className="flex justify-between p-1 text-xl">
          <div> 포인트 : <span className="text-primary">{member?.mem_point}점</span></div>
          <div> 구독정보 : <span className="text-primary">{member?.mes_name}</span></div>
        </div> 
        <div className="p-1 text-xl">
          <div> 경험치 : <span className="text-primary">{member?.mem_exp_point}점</span></div>
        </div> 
      </CardContent>
    </Card>
  )
}

export default WorkoutTrackingUser;