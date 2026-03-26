import express from 'express';
import Logger from '../logger.js'
import { getWorkoutDetails, getWorkoutHistory } from '../db.js';

const workoutRouter = express.Router();

workoutRouter.get('/getWorkoutDetails', async (req, res) => {
  let apiLogEntry = null;
  try {
    const { wor_id } = req.query as { wor_id: string };
    if (!wor_id) {
      return res.status(400).json({
        success: false,
        error: '운동기록 ID가 필요합니다.'
      });
    }
    apiLogEntry = await Logger.logApiStart('GET /api/workout/getWorkoutDetails', [wor_id]);
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
workoutRouter.get('/getWorkoutHistory', async (req, res) => {
  let apiLogEntry = null;  
  try {
    const { mem_id } = req.query as { mem_id?: string };  
    apiLogEntry = await Logger.logApiStart('GET /api/workout/getWorkoutHistory', [mem_id]);
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

export default workoutRouter;