import Logger from '../logger.js'
import express from 'express';
import { Request, Response } from 'express';
import { completeWorkoutRecord, getLatestFinishedWorkoutId, getLatestWorkoutId, getWorkoutDetails, getWorkoutHistory, getWorkoutRecords, getWorkoutRecordsByPivot, getWorkoutRecordsWithPlan, getWorkoutRecordsWithPlanByPivot, getWorkouts, initWorkoutRecord } from '../db.js';
import { Workout, WorkoutDetail } from 'shared';

const workoutRouter = express.Router();

workoutRouter.get('/getLatestFinishedWorkoutId', async (req: Request, res: Response) => {
  let apiLogEntry = null;  
  try {
    const { mem_id } = req.query as { mem_id?: string };
    if(!mem_id || mem_id === "") {
      return res.status(400).json({ success: false, error: '회원정보 파라미터가 누락되었습니다.' });
    }
    apiLogEntry = await Logger.logApiStart('GET /api/workout/getLatestFinishedWorkoutId', [mem_id]);
    const result = await getLatestFinishedWorkoutId(Number(mem_id));
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

workoutRouter.get('/getWorkoutDetails', async (req: Request, res: Response) => {
  let apiLogEntry = null;
  try {
    let { mem_id, wor_id } = req.query as {mem_id: string, wor_id: string | null};
    apiLogEntry = await Logger.logApiStart('GET /api/workout/getWorkoutDetails', [wor_id]);
    const workouts = await getWorkouts();
    if (mem_id == null || mem_id === '') {
      const workoutDetails: WorkoutDetail[] = workouts.map((record: Workout) => ({
        WOO_ID: record.WOO_ID,
        WOO_NAME: record.WOO_NAME,
        WOO_IMG: record.WOO_IMG,
        WOO_UNIT: record.WOO_UNIT,
        WOO_TYPE: record.WOO_TYPE,
        WOD_GUIDE: record.WOO_GUIDE,
        WOD_TARGET_REPS: record.WOO_TARGET_REPS,  
        WOD_TARGET_SETS: record.WOO_TARGET_SETS,
        WOD_COUNT: 0,   // 로그인 안한 상태에서는 운동 횟수 정보가 없으므로 0으로 설정
        WOD_POINT: 0,    // 로그인 안한 상태에서는 포인트 정보가 없으므로 0으로 설정
        WOD_ACCURACY: 0, // 로그인 안한 상태에서는 정확도 정보가 없으므로 0으로 설정
        WOD_TIME: 0      // 로그인 안한 상태에서는 운동 시간 정보가 없으므로 0으로 설정
      }));
      return res.json({
        success: true,
        data: workoutDetails.slice(0, 3),
        wor_id: 0,        
        wor_id_view: "",
        timestamp: new Date().toISOString()
      });
    }    
    let wor_id_view : string= "";
    let data = await getWorkoutDetails(Number(wor_id));
    if (data.length === 0) {
      // 데이터 오브젝트 구성
      const result = await initWorkoutRecord(Number(mem_id), new Date().toISOString().split('T')[0]);
      if (result) {
        wor_id = result.WOR_ID.toString();
        wor_id_view = result.WOR_ID_VIEW; // 예시로 WOR_ID_VIEW를 사용, 실제로는 적절한 값을 설정해야 함
      }
      else {
        res.status(500).json({
          success: false,
          error: "운동 기록 생성에 실패했습니다."
        });
        return;
      }    
      data = await getWorkoutDetails(Number(wor_id));
    }
    res.json({
      success: true,
      data: data,
      wor_id: wor_id,
      wor_id_view: wor_id_view, // 예시 운동 기록 ID 뷰 추가
      count: data.length,
      timestamp: new Date().toISOString()
    });
    await Logger.logApiSuccess(apiLogEntry);
  } catch (error) {
    console.error("❌ 운동 상세 정보 조회 중 오류 발생:", error); // 💡 오류 로그
    await Logger.logApiError(apiLogEntry, error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});
workoutRouter.get('/getWorkoutHistory', async (req: Request, res: Response) => {
  let apiLogEntry = null;  
  try {
    const { mem_id } = req.query as { mem_id?: string };
    if(!mem_id || mem_id === "") {
      return res.status(400).json({ success: false, error: 'mem_id 파라미터가 누락되었습니다.' });
    }
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
workoutRouter.get('/getWorkouts', async (req: Request, res: Response) => {
  let apiLogEntry = null;
  try {
    apiLogEntry = await Logger.logApiStart('GET /api/workout/getWorkouts', [] );
    const workouts = await getWorkouts();
    res.json({
      success: true,
      data: workouts,
      count: workouts.length,
      timestamp: new Date().toISOString()
    });
    await Logger.logApiSuccess(apiLogEntry);
  } catch (error) {
    console.error("❌ 운동 상세 정보 조회 중 오류 발생:", error); // 💡 오류 로그
    await Logger.logApiError(apiLogEntry, error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});
workoutRouter.get('/getWorkoutRecords', async (req: Request, res: Response) => {
  let apiLogEntry = null;
  try {
    const { mem_id, from_dt, to_dt } = req.query as { mem_id?: string; from_dt: string; to_dt: string };
    if(!mem_id || mem_id === "") {
      return res.status(400).json({ success: false, error: '회원정보 파라미터가 누락되었습니다.' });
    }
    if (!from_dt || !to_dt) {
      return res.status(400).json({ success: false, error: '날짜 정보가 누락되었습니다.' });
    }
    apiLogEntry = await Logger.logApiStart('GET /api/workout/getWorkoutRecords', [mem_id, from_dt, to_dt]);
    const data = await getWorkoutRecords(Number(mem_id), from_dt, to_dt);
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
workoutRouter.get('/getWorkoutRecordsByPivot', async (req: Request, res: Response) => {
  let apiLogEntry = null;
  try {
    const { mem_id } = req.query as { mem_id?: string };
    const { from_dt } = req.query as { from_dt: string };
    const { to_dt } = req.query as { to_dt: string };
    if (!mem_id) {
      return res.status(400).json({
        success: false,
        error: '회원 ID가 필요합니다.'
      });
    }
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
    apiLogEntry = await Logger.logApiStart('GET /api/workout/getWorkoutRecordsByPivot', [mem_id, from_dt, to_dt]);
    const records = await getWorkoutRecordsByPivot(Number(mem_id), from_dt, to_dt);
    res.json({
      success: true,
      data: records.DATA,
      columns: records.COLUMNS,      
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
workoutRouter.get('/getWorkoutRecordsWithPlan', async (req: Request, res: Response) => {
    let apiLogEntry = null;
    try {
        const { mem_id, from_dt, to_dt } = req.query as { 
            mem_id: string; 
            from_dt: string; 
            to_dt: string; 
        };
        // 필수 파라미터 체크
        if (!mem_id || !from_dt || !to_dt) {
            return res.status(400).json({
                success: false,
                error: '회원 ID와 조회 기간(from, to)이 모두 필요합니다.'
            });
        }
        apiLogEntry = await Logger.logApiStart('GET /api/workout/getWorkoutRecordsWithPlan', [mem_id, from_dt, to_dt]);

        const data = await getWorkoutRecordsWithPlan(Number(mem_id), from_dt, to_dt);

        res.json({
            success: true,
            data: data, // 결과는 목록이므로 배열 그대로 리턴
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
workoutRouter.get('/getWorkoutRecordsWithPlanByPivot', async (req: Request, res: Response) => {
  let apiLogEntry = null;
  try {
    const { mem_id } = req.query as { mem_id?: string };
    const { from_dt } = req.query as { from_dt: string };
    const { to_dt } = req.query as { to_dt: string };
    if (!mem_id) {
      return res.status(400).json({
        success: false,
        error: '회원 ID가 필요합니다.'
      });
    }
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
    apiLogEntry = await Logger.logApiStart('GET /api/workout/getWorkoutRecordsWithPlanByPivot', [mem_id, from_dt, to_dt]);
    const records = await getWorkoutRecordsWithPlanByPivot(Number(mem_id), from_dt, to_dt);
    res.json({
      success: true,
      data: records.DATA,
      columns: records.COLUMNS,      
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
workoutRouter.post('/complete', async (req: Request, res: Response) => {
  let apiLogEntry = null;
  try {
    // 1. 프론트엔드에서 보낸 데이터 꺼내기 (woo_id 포함!)
    const { mem_id, wor_id, count, duration, accuracy, woo_id } = req.body;
    
    // 로그 기록
    apiLogEntry = await Logger.logApiStart('POST /api/workout/complete', [mem_id, wor_id, count, duration, accuracy, woo_id]);

    // 💡 2. [핵심] 아까 만든 DB 함수를 여기서 드디어 실행합니다!!!
    const earnedPoint = await completeWorkoutRecord(
        Number(mem_id), 
        Number(wor_id), 
        Number(count), 
        Number(duration), 
        Number(accuracy),
        Number(woo_id)
    );

    // 3. 작업이 끝났으면 프론트엔드에 획득한 포인트와 함께 성공 응답 보내기
    res.json({
      success: true,
      message: `운동 기록 및 포인트 저장 완료! (${earnedPoint}P 획득)`,
      earnedPoint: earnedPoint,
      timestamp: new Date().toISOString()
    });

    await Logger.logApiSuccess(apiLogEntry);
  } catch (error) {
    console.error("❌ 운동 완료 처리 중 오류 발생:", error);
    await Logger.logApiError(apiLogEntry, error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default workoutRouter;