import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field,  FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function MemberLoginMain() {
  const [id, setId] = useState('');  // 👈 ID 상태 추가
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();  // 👈 폼 기본 제출 방지
    
    if (!id || !password) {
      alert('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 👇 Axios POST 호출
      const response = await axios.post('http://localhost:3001/api/check_member', {
        id,          
        password
      });
      
      if (response.data.success) {
        // 로그인 성공 처리 (리다이렉트, 토큰 저장 등)
        window.location.href = '/';
        localStorage.setItem("memberID", id);
      } else {
        localStorage.setItem("memberID", "");        
      }
    } catch (error: any) {
      console.error('로그인 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full relative z-10 flex items-start  justify-start">
      {/* 로고 */}
      <div className="w-1/2 text-center p-8">
        <div className="mx-auto rounded-2xl backdrop-blur-sm flex items-center justify-center mb-6">
          <img src="/menu/member.jpg" alt="로그인" className="rounded-2xl"/>
        </div>
        <h2 className="text-3xl font-bold mb-2 text-focus">HomeFit</h2>
        <p className="text-lg text-primary">홈트레이닝 세계로 들어오세요</p>
      </div>      
      {/* 로그인 폼 */}
      <div className="w-1/2 text-center p-8">
        <div className="border rounded-2xl p-8">
          <form onSubmit={handleSubmit} >
          <FieldGroup>
            <FieldSet className="w-full max-w-xs">
              <FieldLegend className="text-2xl! text-center mb-8">로그인</FieldLegend>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="checkout-id">
                    아이디
                  </FieldLabel>
                  <Input
                    className=' bg-white'
                    id="checkout-id"
                    placeholder="예) homefit123@naver.com"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
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
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
