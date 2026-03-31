import express from 'express';
import Logger from '../logger.js'
import { getGoods, getRanking } from '../db.js';

const rewardRouter = express.Router();

rewardRouter.get('/getRanking', async (req, res) => {
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
rewardRouter.get('/getGoods', async (req, res) => {
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

export default rewardRouter;
