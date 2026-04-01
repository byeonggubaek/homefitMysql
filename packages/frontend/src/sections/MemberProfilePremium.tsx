import { useEffect, useState } from "react";
import { useUser } from "@/hooks/UserContext";
import axios from "axios";
import type { Membership } from "shared";

const MemberProfilePremium = () => {
    const { member } = useUser();
    const [memberships, setMemberships] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            await axios.get('http://localhost:3001/api/member/getMemberships')
                .then(response => {
                    if (response.data.success) setMemberships(response.data.data);
                })
                .catch(error => console.error("멤버십 데이터 로딩 실패!", error));
        };
        loadData();
    }, []); // 빈 배열이므로 컴포넌트가 처음 켜질 때 딱 한 번 실행
    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-[#333] mb-6">HomeFit 구독 서비스 관리</h1>
                <span className="self-start bg-[#fff9e6] text-[#ffa800] text-xs font-bold px-2 py-1 rounded-md border border-[#ffeebf]">
                    회원
                </span>
            </div>

            <div className="w-full border-2 border-[#f0f0f0] rounded-lg p-8 flex flex-col items-center justify-center">
                <img src="/logo.svg" width="100" height="100" alt="로고" className="shadow-sm mb-4" />
                <div className="w-full border-2 p-6 mt-6">
                    <p className="font-bold mb-4">{member?.MES_NAME} MemberShip 환영합니다</p>
                    <p>
                        <span style={{ color: "skyblue", fontWeight: "bold" }}>
                            {member?.MEM_NICKNAME || "회원"}
                        </span>님, 지금
                        <span style={{ color: "skyblue", fontWeight: "bold" }}>
                            {member?.MES_NAME}
                        </span> 혜택으로 서비스를 이용 중입니다!
                    </p>
                    <p className="mt-2 text-gray-600">
                        다음 달 결제 예정 금액은
                        <span className="font-bold text-blue-600 ml-1">
                            {Number(member?.MES_FEE || 0).toLocaleString()}원
                        </span> 입니다.
                    </p>
                </div>
            </div>

            <div className="w-full flex flex-col items-center mt-8 border-2 border-[#f0f0f0] rounded-lg p-8">
                <div className="w-full max-w-4xl mb-6">
                    <span className="text-blue-600 text-[10px] font-bold uppercase tracking-widest ml-1">Membership Plan</span>
                    <h3 className="text-2xl font-black italic text-gray-900">HOMEFIT PLUS+ </h3>
                </div>

                <div className="flex flex-wrap justify-center gap-8 w-full max-w-5xl mx-auto">
                    {memberships
                        .map((membership: Membership) => {
                            if (membership.MES_ID === 1) {
                                return null;
                            }

                            const isVip = membership.MES_ID === 3;

                            return (
                                <div
                                    key={membership.MES_ID}
                                    className={`flex-1 min-w-[320px] max-w-[420px] group relative border-2 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col justify-between ${isVip ? 'border-purple-100 bg-purple-50/10 hover:border-purple-300' : (membership.MES_NAME === "PREMIUM" ? 'border-blue-100 bg-blue-50/20' : 'border-gray-100 bg-white')
                                        }`}
                                >
                                    <div>

                                        {member?.MES_ID === membership.MES_ID && (
                                            <div className={`
                                                absolute -top-2 -right-2           
                                              text-white text-[11px] px-4 py-1.5 
                                                rounded-full font-black tracking-wider shadow-lg
                                                z-10 animate-bounce-short          
                                                ${isVip
                                                    ? 'bg-linear-to-r from-purple-600 to-indigo-600'
                                                    : 'bg-linear-to-r from-blue-500 to-cyan-500'
                                                }
    `                                       }>
                                                이용 중
                                            </div>
                                        )}
                                        <div className="flex justify-between items-baseline mb-6">
                                            <div className={`text-2xl font-black italic ${isVip ? 'text-purple-700' : 'text-gray-900'}`}>
                                                {membership.MES_NAME}
                                            </div>

                                            {/* 💰 오른쪽 끝에 배치될 가격 */}
                                            <div className="text-right">
                                                <p className={`text-xl font-bold ${isVip ? 'text-purple-600' : 'text-gray-800'}`}>
                                                    {Number(membership.MES_FEE).toLocaleString()}
                                                </p>
                                                <span className="text-xs ml-1 text-gray-500 font-medium">원/월</span>
                                            </div>
                                        </div>
                                        <ul className="space-y-4 text-gray-600">
                                            {membership.MES_BENEFITS.map((benefit: any) => (
                                                <li key={benefit.BEN_ID} className="flex items-center gap-3 font-medium text-sm">
                                                    <span className={isVip ? 'text-purple-500' : 'text-blue-500'}>✔️</span>
                                                    {benefit.BEN_NAME}
                                                </li>
                                            ))}
                                        </ul>

                                    </div>

                                    <div className="mt-8">
                                        {member?.MES_ID === membership.MES_ID ? (
                                            <button className="w-full py-3 rounded-xl font-bold bg-gray-200 text-gray-500 cursor-default">현재 혜택 유지 중</button>
                                        ) : (

                                            membership.MES_ID > (member?.MES_ID ?? 0) && (
                                                <>
                                                    <button
                                                        onClick={() => alert("준비중...")}
                                                        className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md active:scale-95 ${isVip ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                                    >
                                                        업그레이드
                                                    </button>
                                                </>
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
};

export default MemberProfilePremium;