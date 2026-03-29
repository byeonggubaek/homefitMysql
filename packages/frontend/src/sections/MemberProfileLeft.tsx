
import { useUser } from "@/hooks/UserContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, 
         AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2Icon, CircleDollarSign, SettingsIcon, UserIcon, User } from "lucide-react"
import { useNavigate } from "react-router-dom";
import axios from "axios";

const MemberProfileLeft = ({ onChildData }: { onChildData: (data: string) => void }) => {
    const { member } = useUser();
    const { refetch } = useUser();  //     
    const navigate = useNavigate();

    const handleLogout = async () => {
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
        } finally {
        }
    };

    
    return (
        <div className="flex flex-col gap-10 p-6 h-full border-x rounded-lg">
            <div id='footheader' className="flex flex-col justify-center items-center py-8 gap-3">
                {/* 1. flex-col(세로정렬)과 gap-3(이미지와 글자 사이 간격) 추가 */}


                <img
                    src={member?.MEM_IMG || "/member/member.png"}
                    width="100"
                    height="100"
                    className="rounded-full"
                    alt="프로필"
                    onError={(e) => {
                        // 실제 파일 로드에 실패하면 강제로 기본 이미지로 교체
                        e.currentTarget.src = "/member/member.png";
                    }}
                />


                {/* 2. 이미지 바로 아래에 닉네임 추가 */}
                <span className="font-bold text-lg text-[#333] mb-12">{member?.MEM_NICKNAME || "회원님"}</span>
                <div id='footbody'></div>
                <div className="flex flex-col flex-1">
                    <div className="flex flex-col gap-10">

                        {/* ---- 프로필 시작 ---- */}
                        <div
                            className="group flex items-center gap-3 text-xl cursor-pointer transition-all duration-300"
                            onClick={() => onChildData("profile")}
                        >
                            {/* 아이콘 효과 */}
                                <UserIcon />
                            {/* 글자 굵기 및 색상 변경 */}
                            <span className="transition-all duration-300 group-hover:font-bold group-hover:text-[primary]">프로필</span>
                        </div>

                        {/* ---- Premium 관리 시작 ---- */}
                        <div
                            className="group flex items-center gap-3 text-xl cursor-pointer transition-all duration-300"
                            onClick={() => onChildData("premium")}
                        >
                            <CircleDollarSign/>
                            <span className="transition-all duration-300 group-hover:font-bold group-hover:text-[primary]">구독 관리</span>
                        </div>

                        {/* ---- 설정 시작 ---- */}
                        <div
                            className="group flex items-center gap-3 text-xl cursor-pointer transition-all duration-300"
                            onClick={() => onChildData("setting")}
                        >
                            <SettingsIcon />
                            <span className="transition-all duration-300 group-hover:font-bold group-hover:text-[primary]">설정</span>
                        </div>
                    </div>
                </div>
            </div>


            {/* 하단 메뉴 영역: 가로 구분선 없이 텍스트만 배치 */}
            <div className="mt-auto flex justify-center items-center gap-3 w-full py-6">
                {/* 로그아웃 */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <span className="text-sm text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
                            로그아웃
                        </span>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>로그아웃</AlertDialogTitle>
                            <AlertDialogDescription>로그아웃 하시겠습니까?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLogout}>로그아웃</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* 세로 구분선 */}
                <span className="text-gray-200 text-xs">|</span>

                {/* 고객센터 */}
                <span className="text-sm text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
                    고객센터
                </span>

                {/* 세로 구분선 */}
                <span className="text-gray-200 text-xs">|</span>

                {/* 회원 탈퇴 */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <span className="text-sm text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
                            탈퇴하기
                        </span>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogMedia className="bg-destructive/10 text-destructive">
                                <Trash2Icon size={20} />
                            </AlertDialogMedia>
                            <AlertDialogTitle>정말 탈퇴 하실건가요? 😢</AlertDialogTitle>
                            <AlertDialogDescription>
                                탈퇴 시 지금까지 기록하신 모든 운동 데이터와 프로필 정보가 즉시 삭제되며, 다시 복구할 수 없습니다.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-500 text-white hover:bg-red-600 active:bg-red-700" variant="destructive">
                                탈퇴하기
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>

    )
}

export default MemberProfileLeft