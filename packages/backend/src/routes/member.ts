import express from 'express';
import Logger from '../logger.js'
import { login } from '../db.js';

const memberRouter = express.Router();
memberRouter.post("/login", async (req, res) => {
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
    const result = await login(mem_id_act, mem_password);
    if(result.STATUS === "FAIL") {
      await Logger.logApiError(apiLogEntry, result.ERROR);
      return res.status(401).json({
        success: false,
        error: result.ERROR
      });
    }
    else {
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
      req.session.user = result.USER;
      req.session.isLogined = true;
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

memberRouter.get('/me', (req, res) => {
  try {
    console.log('세션 정보:', req.session.user);
    if (req.session.user) {
      res.json(req.session.user);
      console.log('세션 사용자 정보 반환:', req.session.user);
    } else {
      res.status(401).json({ message: '로그인 필요' });
    }
  } catch (error) {
    console.error('세션 조회 중 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  };
});

export default memberRouter;