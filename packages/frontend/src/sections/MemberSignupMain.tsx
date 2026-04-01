import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { RotateCcw } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "react-router-dom";

// [1] Zod 스키마
const formSchema = z.object({
  mem_id_view: z.string().trim().min(10, "10자 이상").max(50).email("이메일 형식이 아닙니다."),
  mem_name: z.string().min(2, "2자 이상").max(50),
  mem_nickname: z.string().min(2, "2자 이상").max(50),
  mem_password: z.string().min(4, "4자 이상"),
  mem_pnumber: z.string().regex(/^\d{3}-\d{3,4}-\d{4}$/, "010-0000-0000 형식").optional().or(z.literal("")),
  mem_sex: z.enum(["M", "F"]),
  mem_age: z.number().int().nonnegative("나이는 0 이상이어야 합니다."),
  mes_id: z.enum(["1", "2", "3"], { message: "등급을 선택해주세요." }),
});

type FormData = z.infer<typeof formSchema>;

const MemberSignupMain = () => {
  const navigate = useNavigate();  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mem_id_view: "", mem_name: "", mem_nickname: "", mem_password: "",
      mem_pnumber: "", mem_sex: "M", mem_age: 0, mes_id: "3",
    },
  });

  async function onSubmit(data: FormData) {
    try {
      const response = await fetch("http://localhost:3001/api/member/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        navigate('/member/login'); // 로그인페이지로
      } else {
        toast.error(result.error || "처리 중 오류 발생");
      }
    } catch (error) {
      toast.error("통신 오류 발생");
    }
  }
  const watchId = form.watch("mem_id_view");
  const watchPassword = form.watch("mem_password");

  const isUpperFieldsFilled = watchId.length >= 10 && watchPassword.length >= 4;

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
      {/* 왼쪽: 입력 폼 */}
      <div className="w-1/2 text-center p-8">
        <Card className="h-full shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight text-left">회원 정보 입력</CardTitle>
              <CardDescription className="text-slate-500 text-lg">회원 정보를 입력하세요.</CardDescription>
            </div>
            <CardAction>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => form.reset()} className="cursor-pointer">
                  <RotateCcw className="mr-2 size-4" /> 초기화
                </Button>
                <Button type="submit" size="sm" form="signup-form" className="cursor-pointer shadow-xs">제출하기</Button>
              </div>
            </CardAction>
          </CardHeader>
          
          <CardContent>
            <form id="signup-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
              
              {/* v4 스타일 입력 필드 렌더러 함수 */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "mem_id_view", label: "아이디 (이메일)", placeholder: "example@mail.com", type: "text" },
                  { name: "mem_password", label: "비밀번호", placeholder: "10자 이상", type: "password" }
                ].map((input) => (
                  <Controller
                    key={input.name}
                    name={input.name as any}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div className="flex flex-col items-start group space-y-1.5" data-invalid={fieldState.invalid}>
                        <label className="text-sm font-semibold group-data-[invalid=true]:text-destructive transition-colors">
                          {input.label}
                        </label>
                        <Input 
                          {...field} 
                          type={input.type} 
                          placeholder={input.placeholder}
                          autoComplete={input.name === "mem_password" ? "new-password" : "off"}
                          className="group-data-[invalid=true]:border-destructive group-data-[invalid=true]:focus-visible:ring-destructive/50 transition-all shadow-xs"
                        />
                        {fieldState.error && (
                          <p className="text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-0.5">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                ))}
              </div>
              {/* 이름 & 닉네임 그리드 */}
              {isUpperFieldsFilled ? (
                <div className="grid grid-cols-2 gap-4">
                  {["mem_name", "mem_nickname"].map((name) => (
                    <Controller
                      key={name}
                      name={name as any}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <div className="flex flex-col items-start group space-y-1.5" data-invalid={fieldState.invalid}>
                          <label className="text-sm font-semibold group-data-[invalid=true]:text-destructive">{name === "mem_name" ? "이름" : "닉네임"}</label>
                          <Input {...field} className="group-data-[invalid=true]:border-destructive" />
                          {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
                        </div>
                      )}
                    />
                  ))}
                </div>
              ) : null}

              {/* 연락처 & 나이 */}
              {isUpperFieldsFilled ? (              
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Controller
                      name="mem_pnumber"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <div className="group space-y-1.5" data-invalid={fieldState.invalid}>
                          <label className="text-sm font-semibold group-data-[invalid=true]:text-destructive">연락처</label>
                          <Input {...field} placeholder="010-0000-0000" className="group-data-[invalid=true]:border-destructive" />
                          {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
                        </div>
                      )}
                    />
                  </div>
                  <Controller
                    name="mem_age"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div className="flex flex-col items-start group space-y-1.5" data-invalid={fieldState.invalid}>
                        <label className="text-sm font-semibold group-data-[invalid=true]:text-destructive">나이</label>
                        <Input type="number" {...field} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")} className="group-data-[invalid=true]:border-destructive" />
                      </div>
                    )}
                  />
                </div>
              ) : null}

              {/* 성별 & 등급 */}
              {isUpperFieldsFilled ? (                     
                <div className="grid grid-cols-2 gap-4 items-end">
                  <Controller
                    name="mem_sex"
                    control={form.control}
                    render={({ field }) => (
                      <div className="flex flex-col items-start space-y-2">
                        <label className="text-sm font-semibold">성별</label>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 h-10 items-center">
                          <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">
                            <RadioGroupItem value="M" id="m" /><label htmlFor="m" className="text-sm cursor-pointer">남성</label>
                          </div>
                          <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">
                            <RadioGroupItem value="F" id="f" /><label htmlFor="f" className="text-sm cursor-pointer">여성</label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}
                  />
                  <Controller
                    name="mes_id"
                    control={form.control}
                    render={({ field }) => (
                      <div className="flex flex-col items-start space-y-2">
                        <label className="text-sm font-semibold">멤버십 등급</label>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="shadow-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Free</SelectItem>
                            <SelectItem value="2">Premium</SelectItem>
                            <SelectItem value="3">Vip</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  />
                </div>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberSignupMain;