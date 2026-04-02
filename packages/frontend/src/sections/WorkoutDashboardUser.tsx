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
import { Link } from "react-router-dom";
import { useUser } from '@/hooks/UserContext';

const WorkoutDashboardUser = () => {
  const { member } = useUser();  // Context에서 공유
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-3xl">회원정보 : <span className="text-primary">Lvl {member?.MEM_LVL} </span> </CardTitle>
        <CardAction className="flex items-center gap-2">
          {member?.MES_ID !== 1 && <><UserRoundPlus /><Link className="text-md text-focus" to="/member/profile/premium">구독관리</Link></>}
        </CardAction>      
      </CardHeader>
      <CardContent>
        <div className="flex gap-8 text-lg">
          <div>
            <Avatar className="h-32 w-32">
              <AvatarImage
                src={member?.MEM_IMG || "/member/member.png"}
                alt={member?.MEM_NICKNAME}
                className={member?.MES_ID === 1 ? "grayscale" : ""}            
              />
              <AvatarFallback>사용자</AvatarFallback>
              <AvatarBadge className="w-3 h-3 border-2 border-background bg-green-600 dark:bg-green-800" />         
            </Avatar>
          </div>
          <div>
              <div> 별명 : <span className="text-primary">{member?.MEM_NICKNAME}</span></div>
              <div> 나이 : <span className="text-primary">{member?.MEM_AGE}세</span></div>
              <div> 성별 : <span className="text-primary">{member?.MEM_SEX}</span></div>
          </div> 
        </div>
        <Separator />        
        <div className="flex justify-between p-1 text-xl">
          <div> 포인트 : <span className="text-primary">{member?.MEM_POINT}점</span></div>
          <div> 구독정보 : <span className="text-primary">{member?.MES_NAME}</span></div>
        </div> 
        <div className="p-1 text-xl">
          <div> 경험치 : <span className="text-primary">{member?.MEM_EXP_POINT}점</span></div>
        </div> 
      </CardContent>
    </Card>
  )
}

export default WorkoutDashboardUser;