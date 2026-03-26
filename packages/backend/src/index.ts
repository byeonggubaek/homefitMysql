import express from 'express';
import memberRouter from "./routes/member.js";
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import Logger from './logger.js'
import { 
  closePool, 
  getMenus,  
  getColDescs, 
  getWorkoutPivot, getWorkoutPivotWithPlan, getWorkoutHistory, 
  getMember, 
  getWorkoutDetails,
  getMenuPos,
  searchMenus} from './db.js';
import aiRouter from './routes/ai.js';

//=================================================================================================
// 환경 변수 로드 & 서버 초기화
//=================================================================================================
dotenv.config();
const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", // 프론트 주소
    credentials: true,               // 쿠키/세션 사용 시 필수
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-prod', // .env 필수!
    resave: false,              // 변경 시에만 재저장 (성능 ↑)
    saveUninitialized: false,   // 빈 세션 저장 안 함 (보안 ↑)
    cookie: {
      secure: process.env.NODE_ENV === 'production',  // HTTPS 자동
      httpOnly: true,                 // JS 접근 방지 (XSS 방어)
      sameSite: 'lax',                // CSRF 방어
      maxAge: 1000 * 60 * 60 * 24     // 24시간
    }
  })
);
app.use(express.json());
app.use("/api/member", memberRouter); // 라우터 등록
app.use("/api/ai", aiRouter); // AI 라우터 등록

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
    const data = await getWorkoutDetails(wor_id);
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
app.get('/api/searchMenus', async (req, res) => {
  let apiLogEntry = null;  
  try {
    const { key } = req.query as { key: string };  
    if (!key) {
      return res.status(400).json({
        success: false,
        error: '검색어가 필요합니다.'
      });
    }
    apiLogEntry = await Logger.logApiStart('GET /api/searchMenus', [key]);
    const data = await searchMenus(key);
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
app.post('/api/login', async (req, res) => {
  let apiLogEntry = null;
  try {
    const { mem_id_act, mem_password } = req.body;  // 👈 자동 파싱    
    if (!mem_id_act) {
      return res.status(400).json({
        success: false,
        error: '회원 ID가 필요합니다.'
      });
    }
    if (!mem_password) {
      return res.status(400).json({
        success: false,
        error: '회원 비밀번호가 필요합니다.'
      });
    }
    apiLogEntry = await Logger.logApiStart('POST /api/login', [mem_id_act]);
    const result = await checkMember(mem_id_act, mem_password);
    if(result.STATUS === "FAIL") {
      return res.status(401).json({
        success: false,
        error: result.ERROR
      });
      await Logger.logApiError(apiLogEntry, result.ERROR);
    }
    else {
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
      console.log('세션에 사용자 정보 저장:', result.USER);
      req.session.user = result.USER;      
      await Logger.logApiSuccess(apiLogEntry);
    }
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
    apiLogEntry = await Logger.logApiStart('GET /api/getWorkoutPivot', [memberId, from, to]);
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


