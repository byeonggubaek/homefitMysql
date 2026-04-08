import express from 'express';
import { Request, Response } from 'express';
import Logger from '../logger.js'
import { addMemberPlan, checkPwMatch, deleteMemberPlan, getAiReportByWorId, getMember, getMemberships, getMonthStatus, getWorkoutDetails, insertAiReport, insertMember, login, MemberPlans, updateMemberInfo } from '../db.js';
import jwt from 'jsonwebtoken';
import { Member, T_MEMBER } from 'shared';
import { GoogleGenerativeAI } from '@google/generative-ai';

const memberRouter = express.Router();

memberRouter.post("/login", async (req: Request, res: Response) => {
  let apiLogEntry = null;
  try {
    const { mem_id_act, mem_password } = req.body;  // 👈 자동 파싱    
    if (!mem_id_act) {
      return res.status(401).json({
        success: false,
        error: '회원 ID가 필요합니다.'
      });
    }
    if (!mem_password) {
      return res.status(401).json({
        success: false,
        error: '회원 비밀번호가 필요합니다.'
      });
    }
    apiLogEntry = await Logger.logApiStart('POST /api/member/login', [mem_id_act]);
    const result = await login(mem_id_act, mem_password);
    if(result.STATUS === "FAIL") {
      await Logger.logApiError(apiLogEntry, result.ERROR);
      return res.status(401).json({
        success: false,
        error: result.ERROR
      });
    }
    else {
      req.session.user = result.USER;
      req.session.isLogined = true;
      const member : Member = result.USER as Member;
      const token = jwt.sign(
        {
          mem_id: member.MEM_ID,
          mem_id_act: member.MEM_ID_ACT,
          mem_name: member.MEM_NAME,
          mem_nickname: member.MEM_NICKNAME,
          mem_img: member.MEM_IMG,
          mem_sex: member.MEM_SEX,
          mem_age: member.MEM_AGE,
          mem_point: member.MEM_POINT,
          mem_exp_point: member.MEM_EXP_POINT,
          mem_lvl: member.MEM_LVL
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' } // 7일 유효
      );
      res.cookie('sessionID', token, { httpOnly: true });      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });      
      await Logger.logApiSuccess(apiLogEntry);
    }
  } catch (error) {
    console.error('로그인 처리 중 오류:', error);
    await Logger.logApiError(apiLogEntry, error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});
memberRouter.post("/logout", async (req: Request, res: Response) => {
  let apiLogEntry = null;
  try {
    apiLogEntry = await Logger.logApiStart('POST /api/member/logout', []);
    // 1) 세션 제거 (express-session 기준)
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('세션 제거 오류:', err);
        }
      });
    }
    // 2) JWT 담긴 httpOnly 쿠키 삭제
    res.clearCookie('sessionID', {
      httpOnly: true,
      secure: false,      // 운영환경: true + HTTPS
      sameSite: 'lax',
      path: '/',          // 생성할 때와 동일해야 함
    });
    // 3) 응답
    return res.json({
      success: true,
      message: '로그아웃 완료',
    });
    await Logger.logApiSuccess(apiLogEntry);
  } catch (error) {
    console.error('로그아웃 처리 중 오류:', error);
    await Logger.logApiError(apiLogEntry, error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});
memberRouter.post('/signup', async (req: Request, res: Response) => {
    let apiLogEntry = null;
    try {
        const { 
            mem_id_view, mem_name, mem_nickname, mem_password, mem_img, 
            mem_pnumber, mem_email, mem_sex, mem_age, mes_id 
        } = req.body;
        // 필수값 검증
        if (!mem_id_view || !mem_name || !mem_password || !mem_sex || !mes_id) {
            return res.status(400).json({
                success: false,
                error: '필수 정보(회원 ID, 이름, 패스워드, 성별, 등급)가 누락되었습니다.'
            });
        }

        apiLogEntry = await Logger.logApiStart('POST /api/insertMember', [mem_name, mem_email]);

        // 서비스 호출을 위한 데이터 구성
        const memberData: T_MEMBER = {
            MEM_ID_VIEW: mem_id_view, // 서비스 내부에서 생성 및 업데이트 예정
            MEM_NAME: mem_name,
            MEM_NICKNAME: mem_nickname ?? null,
            MEM_PASSWORD: mem_password,
            MEM_IMG: mem_img ?? null,
            MEM_PNUMBER: mem_pnumber ?? null,
            MEM_EMAIL: mem_email ?? null,
            MEM_SEX: mem_sex,
            MEM_AGE: Number(mem_age) || 0,
            MEM_POINT: 0,
            MEM_EXP_POINT: 0,
            MEM_LVL: 0,
            MEM_STREAK: 0,
            MES_ID: Number(mes_id)
        };
        const result = await insertMember(memberData);
        res.json({
            success: true,
            data: result, // { MEM_ID, MEM_ID_VIEW } 리턴
            timestamp: new Date().toISOString()
        });

        await Logger.logApiSuccess(apiLogEntry);
    } catch (error) {
        
        if (apiLogEntry) await Logger.logApiError(apiLogEntry, error);
        res.status(500).json({
            success: false,
            error: (error as Error).message
        });
    }
});
memberRouter.get('/me', async (req: Request, res: Response) => {
  let apiLogEntry = null;  
  try {
    apiLogEntry = await Logger.logApiStart('GET /api/member/me', []);
    if (req.session.user) {
      res.json(req.session.user);
      await Logger.logApiSuccess(apiLogEntry);
    } else {
      await Logger.logApiError(apiLogEntry, "로그인 필요");
      res.status(401).json({ message: '로그인 필요' });
    }
  } catch (error) {
    await Logger.logApiError(apiLogEntry, error);
    res.status(500).json({ message: '서버 오류' });
  };
});
memberRouter.get('/getMember', async (req: Request, res: Response) => {
  let apiLogEntry = null;
  try {
    const { mem_id } = req.query as { mem_id: string };
    if (!mem_id) {
      return res.status(400).json({
        success: false,
        error: '회원 ID가 필요합니다.'
      });
    }
    apiLogEntry = await Logger.logApiStart('GET /api/member/getMember', [mem_id]);
    const data = await getMember(mem_id);
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
    await Logger.logApiSuccess(apiLogEntry);
  } catch (error) {
    await Logger.logApiError(apiLogEntry, error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});
memberRouter.get('/getMemberships', async (req: Request, res: Response) => {
  try {
    const data = await getMemberships();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err });
  }
});
memberRouter.get('/getMemberPlan', async (req, res) => {
  let apiLogEntry = null;
  try {
    const { memberId, date } = req.query as { memberId: string; date: string };
    if (!memberId || !date) return res.status(400).json({ success: false, error: '회원 ID와 날짜가 필요합니다.' });
    apiLogEntry = await Logger.logApiStart('GET /getMemberPlan', [memberId, date]);
    const data = await MemberPlans(Number(memberId), date);
    await Logger.logApiSuccess(apiLogEntry);
    res.json({ success: true, data: data, timestamp: new Date().toISOString() });
  } catch (error) {
    if (apiLogEntry) await Logger.logApiError(apiLogEntry, error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
memberRouter.post('/insertMemberPlan', async (req, res) => {
  let apiLogEntry = null;
  try {
    const { MEM_ID, WOO_ID, MEP_DATE, MEP_TARGET_REPS, MEP_TARGET_SETS, MEP_UNIT } = req.body;
    apiLogEntry = await Logger.logApiStart('POST /insertMemberPlan', [MEM_ID, WOO_ID, MEP_DATE]);
    await addMemberPlan({
      MEM_ID: Number(MEM_ID), 
      WOO_ID: WOO_ID, 
      MEP_DATE: MEP_DATE,
      MEP_TARGET_REPS: Number(MEP_TARGET_REPS), 
      MEP_TARGET_SETS: Number(MEP_TARGET_SETS), 
      MEP_UNIT: MEP_UNIT
    });
    await Logger.logApiSuccess(apiLogEntry);
    res.json({ success: true, message: '계획이 등록되었습니다.' });
  } catch (error) {
    if (apiLogEntry) await Logger.logApiError(apiLogEntry, error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

memberRouter.delete('/deleteMemberPlan', async (req, res) => {
  let apiLogEntry = null;
  try {
    const { goalId } = req.query as { goalId: string };
    if (!goalId) return res.status(400).json({ success: false, error: '삭제할 계획 ID가 필요합니다.' });
    apiLogEntry = await Logger.logApiStart('DELETE /deleteMemberPlan', [goalId]);
    await deleteMemberPlan(Number(goalId));
    await Logger.logApiSuccess(apiLogEntry);
    res.json({ success: true, message: '계획이 삭제되었습니다.' });
  } catch (error) {
    if (apiLogEntry) await Logger.logApiError(apiLogEntry, error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

memberRouter.get('/getMonthlyMemberPlan', async (req, res) => {
  let apiLogEntry = null;
  try {
    const { memberId, month } = req.query as { memberId: string; month: string };
    if (!memberId || !month) return res.status(400).json({ success: false, error: '회원 ID와 월 정보가 필요합니다.' });
    apiLogEntry = await Logger.logApiStart('GET /getMonthlyMemberPlan', [memberId, month]);
    const data = await getMonthStatus(Number(memberId), month);
    await Logger.logApiSuccess(apiLogEntry);
    res.json({ success: true, data: data, timestamp: new Date().toISOString() });
  } catch (error) {
    if (apiLogEntry) await Logger.logApiError(apiLogEntry, error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

memberRouter.get('/workreport', async (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: '로그인 필요' });
  }
});

memberRouter.post('/pwcheck', async (req, res) => {
  const { password } = req.body;
  const user = req.session.user;
  if (!user || !user.MEM_ID_VIEW) return res.status(401).json({ message: "로그인 세션이 만료되었습니다." });
  try {
    const isMatched = await checkPwMatch(user.MEM_ID_VIEW, password);
    if (isMatched) res.json({ success: true });
    else res.status(400).json({ success: false, message: "비밀번호가 일치하지 않습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

memberRouter.post('/edit', async (req, res) => {
  const { nickname, pnumber } = req.body;
  const user = req.session.user;
  if (!user) return res.status(401).json({ success: false, message: "로그인 필요" });
  try {
    const success = await updateMemberInfo(user.MEM_ID, nickname, pnumber);
    if (success) {
      if (req.session.user) {
        req.session.user.MEM_NICKNAME = nickname;
        req.session.user.MEM_PNUMBER = pnumber;
      }
      // 💡 [해결] 'void' 형식 식의 truthiness 에러 해결 (await 제거 및 콜백 사용)
      req.session.save(() => {
        console.log("수정 성공 및 세션 저장 완료");
      });
      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ success: false, message: "수정 실패" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
memberRouter.post('/analyzeWorkout', async (req, res) => {
  try {
    const { MEM_ID, WOR_ID } = req.body;
    const FINAL_WOR_ID = WOR_ID || 8; // 기본값 8 (테스트용)

    // 1. [체크] 이미 분석된 결과가 DB(T_AI_REPORT)에 있는지 먼저 확인
    // getAiReportByWorId는 아까 만든 헬퍼 함수를 사용합니다.
    const existing = await getAiReportByWorId(FINAL_WOR_ID);

    if (existing) {
      // 💡 중요: DB 컬럼명(AI_SUMMARY)을 프론트엔드가 기대하는 이름(SUMMARY)으로 매핑해서 보냅니다.
      return res.json({
        success: true,
        data: {
          SUMMARY: existing.AI_SUMMARY,
          RECOMMENDATIONS: typeof existing.AI_RECOMMENDATIONS === 'string'
            ? JSON.parse(existing.AI_RECOMMENDATIONS)
            : existing.AI_RECOMMENDATIONS,
          NEXT_INTENSITY: existing.AI_NEXT_INTENSITY,
          RANK_PERCENT: existing.AI_RANK_PERCENT
        }
      });
    }

    // 2. [데이터 준비] 유저 정보와 해당 세션의 상세 운동 기록을 가져옴
    const user = await getMember(MEM_ID);
    // 💡 getRecentWorkoutRecords 대신 특정 WOR_ID의 상세내역을 가져오는 getWorkoutDetails 사용
    const workoutDetails = await getWorkoutDetails(Number(FINAL_WOR_ID));
    
    if (!workoutDetails || workoutDetails.length === 0) {
      return res.json({ success: false, message: "분석할 운동 기록이 없습니다." });
    }

    // 3. [프롬프트 빌드] WOO_TYPE(상체, 하체 등) 정보를 포함하여 Gemini에게 전달
    const recordText = workoutDetails.map((r: any) =>
      `- ${r.WOO_NAME}(부위: ${r.WOO_TYPE}): 실제 수행 ${r.WOD_COUNT}${r.WOO_UNIT}, 정확도 ${r.WOD_ACCURACY}%`
    ).join("\n");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
    });

    const prompt = `
      당신은 AI 홈트레이닝 서비스 'HomeFit'의 수석 코치입니다.
      사용자(${user[0]?.MEM_NAME}, ${user[0]?.MEM_AGE}세)의 다음 운동 데이터를 분석하세요.
      
      [운동 데이터] 
      ${recordText}
      
      [분석 지침]
      1. 전체적인 총평(SUMMARY)은 부드러우면서도 전문적인 어조로 작성하세요.
      2. 신체 부위별(WOO_TYPE) 밸런스를 고려하여 편중된 운동이 있다면 지적해 주세요.
      3. RECOMMENDATIONS는 사용자가 다음 운동에서 즉시 개선할 수 있는 구체적인 팁 3가지를 배열로 만드세요.
      4. RANK_PERCENT는 정확도와 운동량을 기반으로 상위 1~100 사이의 숫자로 예측하세요.
      5. NEXT_INTENSITY는 반드시 [강하게, 보통, 가볍게] 중 하나의 단어로만 응답하세요. 
      6. 설명이나 문장은 절대 포함하지 마세요. 


      반드시 JSON 형식으로만 응답하세요.
      반드시 다음 4가지 키값만 가진 JSON으로 응답하세요: SUMMARY, RECOMMENDATIONS(3개 배열), NEXT_INTENSITY, RANK_PERCENT. 다른 키값은 절대 사용하지 마세요
    `;

    // memberRouter.ts 내부 JSON 파싱 부분

    // 1. Gemini 답변을 받음
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const analysisResult = JSON.parse(responseText);

    // console.log("🔥 제미나이 답변 도착!!! :", analysisResult); // 👈 이거 터미널에 나오나요?

    // 2. [핵심] 데이터가 대문자인지 소문자인지 상관없이 안전하게 꺼내기
    const finalSummary = analysisResult.SUMMARY || analysisResult.summary || "분석 결과가 없습니다.";
    const finalRecs = analysisResult.RECOMMENDATIONS || analysisResult.recommendations || [];
    let finalIntensity = analysisResult.NEXT_INTENSITY || analysisResult.next_intensity || "보통";
    if (finalIntensity.includes("강하게")) finalIntensity = "강하게";
    else if (finalIntensity.includes("가볍게")) finalIntensity = "가볍게";
    else if (finalIntensity.includes("보통")) finalIntensity = "보통";

    const finalRank = analysisResult.RANK_PERCENT || analysisResult.rank_percent || 50;

    // 3. DB에 저장 (이제 변수가 비어있을 리가 없죠!)
    const resultAi = await insertAiReport({
      WOR_ID: Number(FINAL_WOR_ID),
      AI_SUMMARY: finalSummary,
      AI_RECOMMENDATIONS: JSON.stringify(finalRecs),
      AI_NEXT_INTENSITY: finalIntensity,
      AI_RANK_PERCENT: finalRank
    });
    // 6. [응답] 프론트엔드에 분석 결과 전달
   if (resultAi) {
      // console.log("DB 저장 성공:", { WOR_ID: FINAL_WOR_ID, SUMMARY: finalSummary });
      return res.json({ success: true, data: analysisResult });
    }
    else {      
      console.error("DB 저장 실패:", { WOR_ID: FINAL_WOR_ID, SUMMARY: finalSummary });
      return res.status(500).json({ success: false, message: "분석 결과 저장에 실패했습니다." });
    }
  } catch (error: any) {
    console.error("AI 분석 프로세스 에러:", error.message);
    return res.status(500).json({ success: false, message: "AI 분석 중 오류가 발생했습니다." });
  }
});
export default memberRouter;