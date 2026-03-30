import * as React from "react"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { ChevronsRight } from 'lucide-react';

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"

const formSchema = z.object({
  eventHandler: z
    .string()
    .min(5, "이벤트 핸들러는 최소 5자 이상이어야 합니다.")
    .max(50, "이벤트 핸들러는 최대 50자 이하여야 합니다."),
  table: z
    .string()
    .min(5, "테이블은 최소 5자 이상이어야 합니다.")
    .max(256, "테이블은 최대 256자 이하여야 합니다."),
})

const SystemInsertMain = () => {
  const [generatedPrompt, setGeneratedPrompt] = React.useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventHandler: "",
      table: "",
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      await fetch("http://localhost:3001/api/system/getInsertPrompt", {
        method: "POST", // 실제 통신은 POST로 데이터를 보냄
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      .then(res => res.json())
      .then(data => {
         setGeneratedPrompt(data.data);  
     });    
      toast.success("프롬프트가 생성되었습니다.");
    } catch (error) {
      toast.error("백엔드 호출 중 오류가 발생했습니다.");
      console.error(error);
    }
  }
  const [isCopied, setIsCopied] = React.useState(false);  
  const handleCopy = async () => {
    if (!generatedPrompt) {
      toast.error("복사할 내용이 없습니다.");
      return;
    }
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      toast.success("클립보드에 복사되었습니다!");
    } catch (err) {
      toast.error("복사에 실패했습니다.");
    } finally {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // 2초 후에 상태 초기화
    }
  };

  return (
    <div className="flex gap-4 items-stretch w-full">
      <div className="w-1/2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Backend Code 자동생성 요청서</CardTitle>
            <CardDescription>
              테이블을 입력하면 Backend Code를 생성해주는 LLM 프럼프트를 만들어 줍니다.
            </CardDescription>
            <CardAction>  
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                  초기화
                </Button>
                <Button type="submit" form="form-rhf-demo">
                  제출
                </Button>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <form id="form-rhf-demo" method="POST" onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Controller
                  name="eventHandler"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="form-rhf-demo-title">
                        이벤트 핸들러
                      </FieldLabel>
                      <Input
                        {...field}
                        id="form-rhf-demo-title"
                        aria-invalid={fieldState.invalid}
                        placeholder="이벤트 핸들러를 입력하세요 ex) insertMember "
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="table"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="form-rhf-demo-description">
                        테이블
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupTextarea
                          {...field}
                          id="form-rhf-demo-description"
                          placeholder="테이블을 입력하세요 ex) T_MEMBER"
                          className="min-h-40 resize-none"
                          aria-invalid={fieldState.invalid}
                        />
                        <InputGroupAddon align="block-end">
                          <InputGroupText className="tabular-nums">
                            {field.value.length}/256 characters
                          </InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldDescription>
                        테이블 이름은 5자 이상 256자 이하여야 합니다.
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter>
          </CardFooter>
        </Card>
      </div>
      <div className="w-10">
        <ChevronsRight className="mx-auto mt-20" size={48} />
      </div> 
      <div className="w-1/2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Backend Code 자동생성 프롬프트</CardTitle>
            <CardDescription>
              복사해서 LLM에 입력하면 Backend Code를 자동 생성해 줍니다. 
            </CardDescription>
            <CardAction>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCopy}
                disabled={!generatedPrompt}
                className="ml-4 h-9 px-4 font-semibold"
              >
                {isCopied ? "복사 완료!" : "프롬프트 복사"}
              </Button>            
            </CardAction>
          </CardHeader>
          <CardContent>
            <InputGroup>
              <InputGroupTextarea
                id="form-rhf-demo-description"
                value={generatedPrompt} // ★ 백엔드에서 받은 결과 출력                
                className="min-h-120 resize-none"
                readOnly
              />
              <InputGroupAddon align="block-end">
                <InputGroupText className="tabular-nums">
                </InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SystemInsertMain