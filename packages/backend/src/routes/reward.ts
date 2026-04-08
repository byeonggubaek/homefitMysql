import express from 'express';
import { Request, Response } from 'express';
import Logger from '../logger.js'
import { completeAchievementTransaction, getAchievementList, getGoods, getMember, getPoint, getRanking } from '../db.js';

const rewardRouter = express.Router();

rewardRouter.get('/getRanking', async (req: Request, res: Response) => {
  let apiLogEntry = null;
  try {
    const { from_dt } = req.query as { from_dt: string };
    const { to_dt } = req.query as { to_dt: string };
    if (!from_dt) {
      return res.status(400).json({
        success: false,
        error: '시작일이 필요합니다.'
      });
    }
    if (!to_dt) {
      return res.status(400).json({
        success: false,
        error: '종료일이 필요합니다.'
      });
    }
    apiLogEntry = await Logger.logApiStart('GET /api/getRanking', [from_dt, to_dt]);
    const records = await getRanking(from_dt, to_dt);
    res.json({
      success: true,
      data: records,
      count: records.length,
      timestamp: new Date().toISOString()
    });
    await Logger.logApiSuccess(apiLogEntry);
  } catch (error) {console.log((error as Error).message);
  
    await Logger.logApiError(apiLogEntry, error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});
rewardRouter.get('/getGoods', async (req: Request, res: Response) => {
  let apiLogEntry = null;
  try {
    apiLogEntry = await Logger.logApiStart('GET /getGoods', []);

    const data = await getGoods();

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

// API: 메뉴 위치조회 
// GET /api/get_menu_pos?page=메뉴페이지명
// PARAMETER : page (선택) - 조회할 메뉴 페이지명 
rewardRouter.get('/getPoint', async (req, res) => {
  let apiLogEntry = null;
  try {
    const { mem_id, from, to } = req.query as { mem_id: string; from: string; to: string };
    if (!mem_id || !from || !to) {
      return res.status(400).json({ success: false, error: '필수 파라미터 누락' });
    }

    // [중요] Logger를 통해 쿼리 시작 기록
    apiLogEntry = await Logger.logApiStart('GET /api/getPoint', [mem_id, from, to]);
    
    const pointData = await getPoint(mem_id, from, to);
    
    res.json({
      success: true,
      data: pointData,
      timestamp: new Date().toISOString()
    });

    // 성공 로그 기록
    await Logger.logApiSuccess(apiLogEntry);
  } catch (error) {
    if (apiLogEntry) await Logger.logApiError(apiLogEntry, error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// "업적 리스트 좀 줘봐" 라고 하면 호출되는 주소
rewardRouter.get('/get_achievement_list', async (req, res) => {
  try {
    const { mem_id } = req.query as { mem_id: string };
    const data = await getAchievementList(mem_id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
// API: 업적 달성 및 포인트 수령
// POST /api/complete_achievement
rewardRouter.post('/complete_achievement', async (req, res) => {
  try {
    const { memberId, achievementId, rewardPoint } = req.body;
    
    if (!memberId || !achievementId) {
      return res.status(400).json({ success: false, error: '회원 ID와 업적 ID가 필요합니다.' });
    }

    // 트랜잭션 함수 실행 (보상은 무조건 100P로 강제)
    await completeAchievementTransaction(memberId, achievementId, rewardPoint || 100);
    
    res.json({ success: true, message: '업적 달성! 포인트가 지급되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default rewardRouter;
