import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field,  FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useUser } from '@/hooks/UserContext';
import { useNavigate } from 'react-router-dom'; // 1. import 추가
import axios from 'axios';

export default function MemberLoginMain() {
  const { refetch } = useUser();  // 
  const navigate = useNavigate();  // 👈 navigate 함수 생성
  const [mem_id_act, setMemIdAct] = useState('');  // 👈 ID 상태 추가
  const [mem_password, setMemPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();  
    
    if (!mem_id_act || !mem_password) {
      alert('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    await axios.post('http://localhost:3001/api/member/login',
      {
        mem_id_act,          
        mem_password
      }, 
      { 
        withCredentials: true // 👈 세션 쿠키를 브라우저에 저장하기 위해 반드시 필요!
      }
    )
    .then(async (response) => {
      if (response.data.success) {
        await refetch();  // 헤더 즉시 업데이트
        navigate('/workout/dashboard');
      } else {
        localStorage.setItem("memberID", "");        
      }
    })
    .catch((error) => {
      console.error('로그인 오류:', error);
    })
    .finally(() => {
      setLoading(false);
    });
  };
  return (
    <div className="flex w-full gap-4 rounded-2xl bg-slate-50 items-stretch font-sans antialiased">
      {/* 로고 */}
      <div className="w-1/2 text-center p-8">
        <div className="mx-auto rounded-2xl backdrop-blur-sm flex items-center justify-center mb-6">
          <img src="/menu/member.jpg" alt="로그인" className="rounded-2xl"/>
        </div>
        <h2 className="text-3xl font-bold mb-2 text-focus">HomeFit</h2>
        <p className="text-lg text-primary">홈트레이닝 세계로 들어오세요</p>
      </div>      
      {/* 로그인 폼 */}
      <div className="w-1/2 text-center p-8 ">
        <div className="shadow-sm border rounded-2xl p-6 bg-white">
          <form onSubmit={handleSubmit} >
          <FieldGroup>
            <FieldSet className="w-full max-w-xs">
              <FieldLegend className="text-left text-2xl! mb-8">로그인</FieldLegend>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="checkout-id">
                    아이디
                  </FieldLabel>
                  <Input
                    className=' bg-white'
                    id="checkout-id"
                    placeholder="예) homefit123@naver.com"
                    autoComplete="new-password"
                    value={mem_id_act}
                    onChange={(e) => setMemIdAct(e.target.value)}
                    required
                  />
                </Field>
              <Field className="relative">  {/* relative 부모 */}
                <FieldLabel htmlFor="checkout-password">암호</FieldLabel>
                <Input
                  className="bg-white pr-10"  // 👈 pr-10 공간 확보!
                  id="checkout-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호 입력"
                  autoComplete="on"
                  value={mem_password}
                  onChange={(e) => setMemPassword(e.target.value)}
                  required
                />
                {/* z-10으로 Input 위로 */}
                <Button 
                  variant="ghost"
                  className="absolute w-7! h-7! rounded-full right-1 top-9 z-10 p-1"  // z-10 추가!
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </Button>
              </Field>
              </FieldGroup>
            </FieldSet>
            <FieldSeparator/> 
            <Field orientation="horizontal">
              <Button variant="secondary" className='transition-all duration-200 hover:scale-[1.1]' type="submit" disabled={loading}>
                {loading ? '로그인 중...' : '로그인'}
              </Button>
              <Button variant="outline" className='transition-all duration-200 hover:scale-[1.1]' type="button">암호 찾기</Button>
              <Button variant="outline" className='transition-all duration-200 hover:scale-[1.1]' type="button">신규</Button>
            </Field>
          </FieldGroup>
          </form>

          {/* 소셜 로그인 */}
          <div className="mt-8 space-y-4 bg-secondary rounded-xl p-4">
            <FieldLegend className='text-4xl'>소셜 계정으로</FieldLegend>            

            <div className="grid grid-cols-2 gap-6">
              <Button variant="outline" className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.05]">
                <img src="/google.svg" alt="Google" className="w-5 h-5" />
                Google
              </Button>
              
              <Button variant="outline" className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.05]">
                <img src="/facebook.svg" alt="Facebook" className="w-5 h-5" />
                Facebook
              </Button>
            </div>
          </div>
        </div>
      </div>      
    </div>
  );
}
