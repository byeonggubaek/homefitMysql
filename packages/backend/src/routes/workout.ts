import express from 'express';
import Logger from '../logger.js'
import { getWorkoutDetails, getWorkoutHistory, getWorkouts, initWorkoutRecord, insertWorkoutRecord } from '../db.js';
import { T_WORKOUT_RECORD, Workout, WorkoutDetail } from 'shared';

const workoutRouter = express.Router();

workoutRouter.get('/getWorkoutDetails', async (req, res) => {
  let apiLogEntry = null;
  try {
    let { mem_id, wor_id } = req.query as {mem_id: string, wor_id: string | null};
    const workouts = await getWorkouts();
    if (mem_id == null || mem_id === '') {
      const workoutDetails: WorkoutDetail[] = workouts.map((record: Workout) => ({
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
    if (wor_id == null || wor_id === '') {
      // 데이터 오브젝트 구성
      const workoutData: T_WORKOUT_RECORD = {
          WOR_ID_VIEW: '', 
          MEM_ID: Number(mem_id),
          WOR_DESC: null,
          WOR_DT: null
      };
      const result = await initWorkoutRecord(workoutData);
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
workoutRouter.post('/insertWorkoutRecord', async (req, res) => {
    let apiLogEntry = null;
    try {
        const { mem_id, wor_desc, wor_dt } = req.body;

        // 필수값 검증
        if (!mem_id || !wor_desc) {
            return res.status(400).json({
                success: false,
                error: '회원 ID(mem_id)와 운동 설명(wor_desc)이 필요합니다.'
            });
        }

        apiLogEntry = await Logger.logApiStart('POST /api/insertWorkoutRecord', [mem_id, wor_desc]);

        // 데이터 오브젝트 구성
        const workoutData: T_WORKOUT_RECORD = {
            WOR_ID: '', // 서비스 내부에서 생성 및 업데이트 예정
            MEM_ID: Number(mem_id),
            WOR_DESC: wor_desc,
            WOR_DT: wor_dt || null // null 전달 시 서비스에서 현재 날짜 처리
        };

        const result = await insertWorkoutRecord(workoutData);

        res.json({
            success: true,
            data: result, // { WOR_AUTO_ID, WOR_ID } 리턴
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

export default workoutRouter;