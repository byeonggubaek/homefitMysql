import express from 'express';
import cors from 'cors';
import { 
  closePool, 
  getMenus, searchSubMenus, 
  getColDescs, 
  getWorkoutPivot, getWorkoutPivotWithPlan, getWorkoutHistory, 
  getMember, 
  checkMember,
  getWorkoutDetails,
  getMenuPos,
  getWorkouts} from './db.js';
import dotenv from 'dotenv';
import Logger from './logger.js'
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Member, Workout, WorkoutDetail } from 'shared';

//=================================================================================================
// 환경 변수 로드 & 서버 초기화
//=================================================================================================
dotenv.config();
const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.use(cors());
app.use(express.json());

// 서버 시작
let server: any;
server = app.listen(PORT, () => {
  try {
    console.log(`Backend 가동을 시작합니다.: http://localhost:${PORT}`);
    Logger.log('i', `Backend 시작: http://localhost:${PORT}`);
  } catch (error) {
    console.log(`Backend 가동이 실패했습니다.: ${(error as Error).message}`);
    Logger.logError('Backend 가동 실패', error);
    process.exit(1);
  }
});

// 서버 종료 시
let isShuttingDown = false;
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown); 

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  console.log(`Backend 가동을 종료합니다.`);
  Logger.log('i', `Backend 가동 종료 : ${signal}`);
  try {
    // 1. DB 풀 정리 (이전 대화 참고)
    await closePool()

    // 2. 서버 종료 (대기)
    if (server) {
      await new Promise<void>((resolve) => {
        server!.close((err: any) => {
          if (err) {
            console.log('서버를 중지하는 중 에러가 생겼습니다.', (err as Error).message || err);
          } else {
            console.log('서버를 종료하였습니다.');
          }
          resolve();
        });
      });
    }
    
  } catch (error) {
    console.log('Backend 종료중 에러가 생겼습니다.', (error as Error).message || error);
  } finally {
    console.log('Backend가 완전히 종료되었습니다.');
    process.exit(0);
  }
}

//================================================================================================
// AI 추천 API
//================================================================================================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
app.post('/api/recExercise', async (req, res) => {
  try {
    const { userProfile } = req.body;
    const user = await getMember(userProfile.mem_id) as Member;
    const workouts = await getWorkouts();

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0,           // 이미 OK
        maxOutputTokens: 8192,    // 8192 → 1024 (3배↑)
        topK: 1,                  // 32 → 1 (2배↑)
        topP: 0.1,                // 추가!
        candidateCount: 1         // 명시적 1
      },
      // 시스템 지시어로 즉답 유도
      systemInstruction: "간결하고 빠르게 답변해."
    });

    const userText = `성별: ${user.MEM_SEX}, 나이: ${user.MEM_AGE}, 강도: ${userProfile.intensity}`; 
    const workoutsText = workouts
      .map((w: Workout) => {
        return `- WOO_ID: ${w.WOO_ID}, WOO_NAME: ${w.WOO_NAME}, WOO_IMG: ${w.WOO_IMG}, WOO_GUIDE: ${w.WOO_GUIDE}, WOD_TARGET_SETS: 0, WOD_TARGET_REPS: 0`;
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
      - WOO_ID, WOO_NAME, WOO_IMG 반드시 입력으로 주어진 문자열을 그대로 사용하고 변경하지 마세요
      - 응답은 아래 JSON 배열 코드만 출력해주세요.
      - JSON 외에 설명, 마크다운, \`json 텍스트, 주석, Thought: 등은 절대 포함하지 마세요.
      [반환 형식(JSON 배열)]
      [
        {
          "WOO_ID": "...",
          "WOO_NAME": "...",
          "WOO_IMG": "...",
          "WOO_GUIDE": "...",
          "WOD_TARGET_REPS": 0,
          "WOD_TARGET_SETS": 0
        }
      ]
    `;
    console.log("AI 추천 요청 - 프롬프트:", prompt); // 💡 프롬프트 로그
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();
    
    let recommendedExercises: any[] = [];
    try {
      // JSON 문자열이 ```json ... ``` 으로 둘러싸여 있을 수 있으니 깔끔히 정리
      const cleanText = rawText.replace(/```json|```/g, "").trim();
      recommendedExercises = JSON.parse(cleanText);
      console.warn("결과", recommendedExercises);      
    } catch (parseError) {
      console.warn("AI 응답 파싱 실패, fallback 사용");
      recommendedExercises = [
          { WOO_NAME: "플랭크", WOO_GUIDE: "30초 동안 자세 유지하기.", WOO_IMG: "plank.png", WOD_TARGET_REPS: 0, WOD_TARGET_SETS: 1 },
          { WOO_NAME: "스쿼트", WOO_GUIDE: "다리를 어깨 너비로 벌리고 앉았다 일어나기", WOO_IMG: "squat.png", WOD_TARGET_REPS: 0, WOD_TARGET_SETS: 1 },
          { WOO_NAME: "런지", WOO_GUIDE: "좌우 각 권장 횟수만큼 반복하기", WOO_IMG: "lunge.png", WOD_TARGET_REPS: 0, WOD_TARGET_SETS: 1 }
      ];
    }

    // 💡 여기서 한 번만 응답
    return res.json({
      success: true,
      data: recommendedExercises,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    // 💡 그 외의 실제 에러는 500으로 처리
    console.error("AI 추천 에러:", error);
    if (error.message.includes("429") || error.message.includes("403") || error.message.includes("Quota")) {
      // fallback: 정상 응답으로 돌려줌
      return res.json({
        success: true,
        data: [
          { WOO_NAME: "플랭크", WOO_GUIDE: "30초 동안 자세 유지하기.", WOO_IMG: "plank.png", WOD_TARGET_REPS: 0, WOD_TARGET_SETS: 2 },
          { WOO_NAME: "스쿼트", WOO_GUIDE: "다리를 어깨 너비로 벌리고 앉았다 일어나기.", WOO_IMG: "squat.png", WOD_TARGET_REPS: 0, WOD_TARGET_SETS: 2 },
          { WOO_NAME: "런지", WOO_GUIDE: "손은 어깨너비보다 약간 넓게, 손가락은 앞쪽으로 향하게 위치.", WOO_IMG: "lunge.png", WOD_TARGET_REPS: 0, WOD_TARGET_SETS: 2 }
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
//================================================================================================
//   
//================================================================================================
app.get('/api/getMenus', async (req, res) => {
  let apiLogEntry = null;
  try {
    apiLogEntry = await Logger.logApiStart('GET /api/getMenus', []);
    const data = await getMenus();
    res.json({
      success: true,
      data: data,
      count: data.length,
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
app.get('/api/getMember', async (req, res) => {
  let apiLogEntry = null;
  try {
    const { mem_id } = req.query as { mem_id: string };
    if (!mem_id) {
      return res.status(400).json({
        success: false,
        error: '회원 ID가 필요합니다.'
      });
    }
    apiLogEntry = await Logger.logApiStart('GET /api/getMember', [mem_id]);
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
app.get('/api/getWorkoutDetails', async (req, res) => {
  let apiLogEntry = null;
  try {
    const { wor_id } = req.query as { wor_id: string };
    if (!wor_id) {
      return res.status(400).json({
        success: false,
        error: '운동기록 ID가 필요합니다.'
      });
    }
    apiLogEntry = await Logger.logApiStart('GET /api/getWorkoutDetails', [wor_id]);
    console.warn("운동 상세 정보", wor_id);
    const data = await getWorkoutDetails(wor_id);
    console.warn("운동 상세 정보", data);
    res.json({
      success: true,
      data: data,
      count: data.length,
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
app.get('/api/getMenuPos', async (req, res) => {
  let apiLogEntry = null;  
  try {
    const { page } = req.query as { page?: string };  
    apiLogEntry = await Logger.logApiStart('GET /api/getMenuPos', [page]);
    const data = await getMenuPos(page);
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
app.get('/api/getWorkoutHistory', async (req, res) => {
  let apiLogEntry = null;  
  try {
    const { mem_id } = req.query as { mem_id?: string };  
    apiLogEntry = await Logger.logApiStart('GET /api/getWorkoutHistory', [mem_id]);
    const workoutHistory = await getWorkoutHistory(mem_id);
    res.json({
      success: true,
      data: workoutHistory,
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

// API: 메뉴 검색
// GET /api/search_menus?key=검색어
// PARAMETER : key (필수) - 검색할 메뉴 제목 또는 설명
app.get('/api/search_menus', async (req, res) => {
  let apiLogEntry = null;  
  try {
    const { key } = req.query as { key: string };  
    if (!key) {
      return res.status(400).json({
        success: false,
        error: '검색어가 필요합니다.'
      });
    }
    apiLogEntry = await Logger.logApiStart('GET /api/search_menus', [key]);
    const data = await searchSubMenus(key);
    res.json({
      success: true,
      data: data,
      count: data.length,
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
// API: 테이블 컬럼 설명 조회
// GET /api/get_col_descs?table=테이블명
// PARAMETER : table (필수) - 컬럼 설명을 조회할 테이블 이름
//================================================================================================
// 테이블 컬럼 설명
//================================================================================================
app.get('/api/get_col_descs', async (req, res) => {
    let apiLogEntry = null;
  try {
    const { table } = req.query as { table: string };  // 👈 req.query 사용!

    if (!table) {
      return res.status(400).json({
        success: false,
        error: 'table 이름이 필요합니다.'
      });
    }
    apiLogEntry = await Logger.logApiStart('GET /api/get_col_descs', [table]);
    const colDescs = await getColDescs(table);
    res.json({
      success: true,
      data: colDescs,
      count: colDescs.length,
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
// API: 전체 운동내역 조회
// GET /api/get_workout_records?memberId=회원ID
// PARAMETER : memberId (필수) - 조회할 회원 ID
//================================================================================================
// 운동
//================================================================================================

// API: 전체 운동내역 일별 집계 조회
// GET /api/getWorkoutPivot?memberId=회원ID&from=시작일&to=종료일
// PARAMETER : memberId (필수) - 조회할 회원 ID
//             from (필수) - 조회 시작일 (YYYY-MM-DD)
//             to (필수) - 조회 종료일 (YYYY-MM-DD)
app.get('/api/getWorkoutPivot', async (req, res) => {
  let apiLogEntry = null;
  try {
    const { memberId } = req.query as { memberId: string };
    const { from } = req.query as { from: string };
    const { to } = req.query as { to: string };
    if (!memberId) {
      return res.status(400).json({
        success: false,
        error: '회원 ID가 필요합니다.'
      });
    }
    if (!from) {
      return res.status(400).json({
        success: false,
        error: '시작일이 필요합니다.'
      });
    }
    if (!to) {
      return res.status(400).json({
        success: false,
        error: '종료일이 필요합니다.'
      });
    }        
    apiLogEntry = await Logger.logApiStart('GET /api/get_workout_pivot', [memberId, from, to]);
    const records = await getWorkoutPivot(memberId, from, to);
    res.json({
      success: true,
      data: records.data,
      columns: records.columns,      
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
// API: 전체 운동내역 일별 집계 조회 (플랜 포함)
// GET /api/get_workout_pivot_with_plan?memberId=회원ID&from=시작일&to=종료일
// PARAMETER : memberId (필수) - 조회할 회원 ID
//             from (필수) - 조회 시작일 (YYYY-MM-DD)
//             to (필수) - 조회 종료일 (YYYY-MM-DD)
app.get('/api/get_workout_pivot_with_plan', async (req, res) => {
  let apiLogEntry = null;
  try {
    const { memberId } = req.query as { memberId: string };
    const { from } = req.query as { from: string };
    const { to } = req.query as { to: string };
    if (!memberId) {
      return res.status(400).json({
        success: false,
        error: '회원 ID가 필요합니다.'
      });
    }
    if (!from) {
      return res.status(400).json({
        success: false,
        error: '시작일이 필요합니다.'
      });
    }
    if (!to) {
      return res.status(400).json({
        success: false,
        error: '종료일이 필요합니다.'
      });
    }        
    apiLogEntry = await Logger.logApiStart('GET /api/get_workout_pivot_with_plan', [memberId, from, to]);
    const records = await getWorkoutPivotWithPlan(memberId, from, to);
    res.json({
      success: true,
      data: records.data,
      columns: records.columns,      
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
// API: 메뉴 위치조회 
// GET /api/get_menu_pos?page=메뉴페이지명
// PARAMETER : page (선택) - 조회할 메뉴 페이지명 

//================================================================================================
// 회원정보
//================================================================================================
// API: 회원 정보 조회
// GET /api/get_member?memberId=회원ID
// PARAMETER : memberId (필수) - 조회할 회원 ID
// API: 회원 정보 조회
// POST /api/check_member
// PARAMETER : memberId (필수) - 조회할 회원 ID
// PARAMETER : password (필수) - 조회할 회원 비밀번호
app.post('/api/check_member', async (req, res) => {
  let apiLogEntry = null;
  try {
    const { id, password } = req.body;  // 👈 자동 파싱    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: '회원 ID가 필요합니다.'
      });
    }
    if (!password) {
      return res.status(400).json({
        success: false,
        error: '회원 비밀번호가 필요합니다.'
      });
    }
    apiLogEntry = await Logger.logApiStart('POST /api/check_member', [id]);
    const result = await checkMember(id, password);
    res.json({
      success: true,
      data: result,
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

//================================================================================================
// 우편번호 
//================================================================================================
// API: 우편번호 검색 (한국우편사업진흥원)
// GET /api/get_postcodes?zipcode=우편번호
// PARAMETER : zipcode (필수) - 검색할 우편번호 (5자리)
app.get('/api/get_postcodes', async (req, res) => {
  let apiLogEntry = null;
  try {
    const { zipcode } = req.query;
    
    if (!zipcode || zipcode.length !== 5) {
      return res.status(400).json({ error: '5자리 우편번호 입력' });
    }
    apiLogEntry = await Logger.logApiStart('GET /api/get_postcodes', [zipcode]);
    const serviceKey = process.env.VITE_EPOST_SERVICE_KEY!;
    const url = `http://biz.epost.go.kr/KpostPortal/openapi?regkey=${serviceKey}&target=postNew&query=${zipcode}`;
    
    const response = await fetch(url);
    const xml = await response.text();
    
    const addresses = parseEpostXML(xml);
    res.json({
      success: true,
      data: addresses
    });
    await Logger.logApiSuccess(apiLogEntry);
  } catch (error) {
    await Logger.logApiError(apiLogEntry, error);
    res.status(500).json({ error: (error as Error).message });
  }
});
function parseEpostXML(xml: string) {
  const results: any[] = [];
  
  // 1단계: CDATA 태그 제거 (핵심!)
  const cleanXml = xml
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')  // CDATA 내용만 추출
    .replace(/<postcd>(.*?)<\/postcd>/gs, (match, p1) => `<postcd>${p1.trim()}</postcd>`)
    .replace(/<address>(.*?)<\/address>/gs, (match, p1) => `<address>${p1.trim()}</address>`)
    .replace(/<roadAddress>(.*?)<\/roadAddress>/gs, (match, p1) => `<roadAddress>${p1.trim()}</roadAddress>`);
  
  // 2단계: <item> 추출
  const itemRegex = /<item>(.*?)<\/item>/gs;
  let match;
  
  while ((match = itemRegex.exec(cleanXml)) !== null) {
    const item = match[1];
    
    const postcodeMatch = item.match(/<postcd>([^<]+)<\/postcd>/i);
    const addressMatch = item.match(/<address>([^<]+)<\/address>/i);
    const roadMatch = item.match(/<roadAddress>([^<]+)<\/roadAddress>/i);
    
    if (postcodeMatch?.[1]) {
      results.push({
        postcode: postcodeMatch[1].trim(),
        address: addressMatch?.[1]?.trim() || '',
        roadAddress: roadMatch?.[1]?.trim() || ''
      });
    }
  }
  
  return results;
}


