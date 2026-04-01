import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getMember, getWorkouts } from '../db.js';
const aiRouter = express.Router();
//================================================================================================
// AI 설정 
//================================================================================================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
aiRouter.post('/recExercise', async (req, res) => {
    try {
        const { userProfile } = req.body;
        const user = await getMember(userProfile.mem_id);
        const workouts = await getWorkouts();
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0, // 이미 OK
                maxOutputTokens: 8192, // 8192 → 1024 (3배↑)
                topK: 1, // 32 → 1 (2배↑)
                topP: 0.1, // 추가!
                candidateCount: 1 // 명시적 1
            },
            // 시스템 지시어로 즉답 유도
            systemInstruction: "간결하고 빠르게 답변해."
        });
        const userText = `성별: ${user[0].MEM_SEX}, 나이: ${user[0].MEM_AGE}, 강도: ${userProfile.intensity}`;
        const workoutsText = workouts
            .map((w) => {
            return `- WOO_ID: ${w.WOO_ID}, WOO_NAME: ${w.WOO_NAME}, WOO_IMG: ${w.WOO_IMG}, WOO_UNIT: ${w.WOO_UNIT}, WOD_GUIDE: ${w.WOO_GUIDE}, WOD_TARGET_SETS: ${w.WOO_TARGET_SETS}, WOD_TARGET_REPS: ${w.WOO_TARGET_REPS}`;
        })
            .join("\n");
        const prompt = `
      당신은 HomeFit의 수석 AI 코치입니다.
      [사용자 정보]
      ${userText}
      [보유운동]
      ${workoutsText}
      [조건]
      - 강도(intensity)에 따라 세트/횟수를 다르게 설정하세요.
        - 강도: low  → 낮은 세트/횟수 (부담 없는 수준)
        - 강도: medium → 중간 세트/횟수 (일반적인 운동 강도)
        - 강도: high → 높은 세트/횟수 (도전적인 강도)
      - 나이가 50세 이상이면, 강도가 high여도 과도하게 무리하지 않도록 세트/횟수를 약간 보수적으로 조정하세요.
      - 여성은 남성에 비해 세트/횟수를 약간 낮게 설정하는 것을 고려하세요.
      [지시]
      - 보유운동 중 가장 적합한 3가지만 골라서 추천하세요.
      - 각 운동에 대해:
        - 권장 시간/횟수 WOD_TARGET_REPS
        - 권장 세트 WOD_TARGET_SETS
        - 사용자 맞춤 100자 이내 운동 가이드  WOD_GUIDE
      - WOO_ID, WOO_NAME, WOO_IMG, WOO_UNIT 반드시 입력으로 주어진 문자열을 그대로 사용하고 변경하지 마세요
      - 응답은 아래 JSON 배열 코드만 출력해주세요.
      - JSON 외에 설명, 마크다운, \`json 텍스트, 주석, Thought: 등은 절대 포함하지 마세요.
      [반환 형식(JSON 배열)]
      [
        {
          "WOO_ID": "...",
          "WOO_NAME": "...",
          "WOO_IMG": "...",
          "WOO_UNIT": "...",
          "WOD_GUIDE": "...",
          "WOD_TARGET_REPS": 0,
          "WOD_TARGET_SETS": 0
        }
      ]
    `;
        // console.log("AI 추천 요청 - 프롬프트:", prompt); // 💡 프롬프트 로그
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();
        let recommendedExercises = [];
        try {
            // JSON 문자열이 ```json ... ``` 으로 둘러싸여 있을 수 있으니 깔끔히 정리
            const cleanText = rawText.replace(/```json|```/g, "").trim();
            recommendedExercises = JSON.parse(cleanText);
        }
        catch (parseError) {
            console.warn("AI 응답 파싱 실패, fallback 사용");
            recommendedExercises = [
                { WOO_ID: "WOO00001", WOO_NAME: "플랭크", WOO_IMG: "plank.png", WOO_UNIT: "초", WOD_GUIDE: "30초 동안 자세 유지하기.", WOD_TARGET_REPS: 0, WOD_TARGET_SETS: 1 },
                { WOO_ID: "WOO00002", WOO_NAME: "스쿼트", WOO_IMG: "squat.png", WOO_UNIT: "회", WOD_GUIDE: "다리를 어깨 너비로 벌리고 앉았다 일어나기", WOD_TARGET_REPS: 0, WOD_TARGET_SETS: 1 },
                { WOO_ID: "WOO00003", WOO_NAME: "런지", WOO_IMG: "lunge.png", WOO_UNIT: "회", WOD_GUIDE: "좌우 각 권장 횟수만큼 반복하기", WOD_TARGET_REPS: 0, WOD_TARGET_SETS: 1 }
            ];
        }
        // 💡 여기서 한 번만 응답
        return res.json({
            success: true,
            data: recommendedExercises,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        // 💡 그 외의 실제 에러는 500으로 처리
        console.error("AI 추천 에러:", error);
        if (error.message.includes("429") || error.message.includes("403") || error.message.includes("Quota")) {
            // fallback: 정상 응답으로 돌려줌
            return res.json({
                success: true,
                data: [
                    { WOO_ID: "WOO00001", WOO_NAME: "플랭크", WOO_IMG: "plank.png", WOO_UNIT: "초", WOD_GUIDE: "30초 동안 자세 유지하기.", WOD_TARGET_REPS: 0, WOD_TARGET_SETS: 2 },
                    { WOO_ID: "WOO00002", WOO_NAME: "스쿼트", WOO_IMG: "squat.png", WOO_UNIT: "회", WOD_GUIDE: "다리를 어깨 너비로 벌리고 앉았다 일어나기", WOD_TARGET_REPS: 0, WOD_TARGET_SETS: 2 },
                    { WOO_ID: "WOO00003", WOO_NAME: "런지", WOO_IMG: "lunge.png", WOO_UNIT: "회", WOD_GUIDE: "좌우 각 권장 횟수만큼 반복하기", WOD_TARGET_REPS: 0, WOD_TARGET_SETS: 2 }
                ],
                timestamp: new Date().toISOString()
            });
        }
        return res.status(500).json({
            success: false,
            error: "AI 모델 연결 실패",
            message: error.message
        });
    }
});
export default aiRouter;
