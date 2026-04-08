import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import Logger from './logger.js'
import { 
  closePool, 
  getMenus,  
  getMenuPos,
  getColDesc,
  searchMenus} from './db.js';
import aiRouter from './routes/ai.js';
import memberRouter from "./routes/member.js";
import workoutRouter from './routes/workout.js';
import systemRouter from './routes/system.js';
import rewardRouter from './routes/reward.js';

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
app.use("/api/workout", workoutRouter); // AI 라우터 등록
app.use("/api/system", systemRouter); // 시스템 라우터 등록
app.use("/api/reward", rewardRouter); // 시스템 라우터 등록

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
//  시스템 API (로그, 모니터링 등) - 포팅 후
//================================================================================================
app.get('/api/getMenus', async (req: Request, res: Response) => {
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
app.get('/api/getMenuPos', async (req: Request, res: Response) => {
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
app.get('/api/searchMenus', async (req: Request, res: Response) => {
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
app.get('/api/getColDesc', async (req: Request, res: Response) => {
  let apiLogEntry = null;
  try {
    // 데이터 조회 (WorkoutRecord 고정 조회 혹은 필요 시 query parameter 사용 가능)
    const { table } = req.query as { table: string };      
    // API 시작 로그 기록
    apiLogEntry = await Logger.logApiStart('GET /api/getColDesc', [table]);
    const data = await getColDesc(table);

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });

    // 성공 로그 기록
    await Logger.logApiSuccess(apiLogEntry);
  } catch (error) {
    // 에러 로그 기록
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
app.get('/api/get_postcodes', async (req: Request, res: Response) => {
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


