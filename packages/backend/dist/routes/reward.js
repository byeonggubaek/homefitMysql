import express from 'express';
import Logger from '../logger.js';
import { getRanking } from '../db.js';
const rewardRouter = express.Router();
rewardRouter.get('/getRanking', async (req, res) => {
    let apiLogEntry = null;
    try {
        const { from_dt } = req.query;
        const { to_dt } = req.query;
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
    }
    catch (error) {
        console.log(error.message);
        await Logger.logApiError(apiLogEntry, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
export default rewardRouter;
