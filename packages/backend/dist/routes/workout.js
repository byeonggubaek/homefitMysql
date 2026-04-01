import express from 'express';
import Logger from '../logger.js';
import { getWorkoutDetails, getWorkoutHistory, getWorkouts, initWorkoutRecord, insertWorkoutRecord } from '../db.js';
const workoutRouter = express.Router();
workoutRouter.get('/getWorkoutDetails', async (req, res) => {
    let apiLogEntry = null;
    try {
        let { mem_id, wor_id } = req.query;
        const workouts = await getWorkouts();
        if (mem_id == null || mem_id === '') {
            const workoutDetails = workouts.map((record) => ({
                WOO_ID: record.WOO_ID,
                WOO_NAME: record.WOO_NAME,
                WOO_IMG: record.WOO_IMG,
                WOO_UNIT: record.WOO_UNIT,
                WOD_GUIDE: record.WOO_GUIDE,
                WOD_TARGET_REPS: record.WOO_TARGET_REPS,
                WOD_TARGET_SETS: record.WOO_TARGET_SETS,
            }));
            return res.json({
                success: true,
                data: workoutDetails.slice(0, 3),
                wor_id: 0,
                timestamp: new Date().toISOString()
            });
        }
        if (wor_id == null || wor_id === '0') {
            // 데이터 오브젝트 구성
            const result = await initWorkoutRecord(Number(mem_id), new Date().toISOString().split('T')[0]);
            if (result) {
                wor_id = result.WOR_ID.toString();
            }
            else {
                res.status(500).json({
                    success: false,
                    error: "운동 기록 생성에 실패했습니다."
                });
                return;
            }
        }
        apiLogEntry = await Logger.logApiStart('GET /api/workout/getWorkoutDetails', [wor_id]);
        const data = await getWorkoutDetails(wor_id);
        res.json({
            success: true,
            data: data,
            wor_id: wor_id,
            count: data.length,
            timestamp: new Date().toISOString()
        });
        await Logger.logApiSuccess(apiLogEntry);
    }
    catch (error) {
        console.error("❌ 운동 상세 정보 조회 중 오류 발생:", error); // 💡 오류 로그
        await Logger.logApiError(apiLogEntry, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
workoutRouter.get('/getWorkoutHistory', async (req, res) => {
    let apiLogEntry = null;
    try {
        const { mem_id } = req.query;
        apiLogEntry = await Logger.logApiStart('GET /api/workout/getWorkoutHistory', [mem_id]);
        const workoutHistory = await getWorkoutHistory(mem_id);
        res.json({
            success: true,
            data: workoutHistory,
            timestamp: new Date().toISOString()
        });
        await Logger.logApiSuccess(apiLogEntry);
    }
    catch (error) {
        await Logger.logApiError(apiLogEntry, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
export default workoutRouter;
