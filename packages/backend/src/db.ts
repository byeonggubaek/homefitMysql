import mysql, { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { NavItem, NavSubItem, ColDesc, WorkoutRecord, ChartData, MenuPos, WorkoutHistory, Member, WorkoutDetail, MemberExists, Workout } from 'shared';
import dotenv from 'dotenv';
import Logger from './logger.js'

// 환경 변수 로드
dotenv.config();

let pool: mysql.Pool | null = null;
let poolPromise: Promise<mysql.Pool> | null = null;

// 1. 커넥션 풀 생성
export async function initPool(): Promise<void> {
  if (pool) return;
  if (!poolPromise) {
    poolPromise = (async () => {
      try {
        const p = await mysql.createPool({
          host: process.env.MYSQL_HOST!,
          user: process.env.MYSQL_USER!,
          password: process.env.MYSQL_PASSWORD!,
          database: process.env.MYSQL_DATABASE!,
          port: Number(process.env.MYSQL_PORT!) || 3306,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });
        console.log('DB 풀 생성 완료');
        await Logger.log('i', 'DB 풀 생성 성공');
        return p;
      } catch (error) {
        console.error('DB 풀 생성 실패:', error);
        await Logger.logError('DB 풀 생성 실패', error);
        throw error;
      }
    })();
  }
  pool = await poolPromise;
}

export async function closePool(): Promise<void> {
  if (!pool) return;
  try {
    await pool.end(); // MySQL 풀 종료
    console.log('DB풀을 종료하였습니다.');
    await Logger.log('i', 'DB풀 종료 성공');
  } catch (error) {
    console.log('DB풀을 종료하지 못했습니다.', (error as Error).message || error);
    await Logger.logError('DB풀 종료 실패', (error as Error).message || error);
    throw error;
  }
}

export async function select<T extends RowDataPacket = RowDataPacket>(
  sql: string, 
  binds: any[] = []
): Promise<T[]> {
  let logEntry: any = null;
  
  try {
    await initPool();
    logEntry = await Logger.logQueryStart(sql, binds);
    const [rows] = await pool!.execute<T[]>(sql, binds);
    await Logger.logQuerySuccess(logEntry, rows.length || 0);    
    return rows as T[];
  } catch (error: any) {
    await Logger.logQueryError(logEntry, error.message || error);
    throw error;
  }
}

// 2. 트랜잭션 래퍼 유틸
export async function withTransaction<T>(
  handler: (conn: PoolConnection) => Promise<T>,
): Promise<T> {
  let conn: PoolConnection | null = null;

  try {
    if (!pool) {
      throw new Error('DB 풀이 초기화되지 않았습니다.');
    }
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const result = await handler(conn);

    await conn.commit();
    return result;
  } catch (err) {
    if (conn) {
      await conn.rollback();
    }
    throw err;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

/**
 * 쿼리 실행 (SELECT) - 수정됨!
 */
// async function select(sql: string, binds: any[] = []): Promise<any[]> {
//   let logEntry = null;
//   try {
//     // 1. 쿼리 시작 로그
//     initPool();
//     if (!pool) 
//       throw new Error('DB 풀이 초기화되지 않았습니다.');
//     logEntry = await Logger.logQueryStart(sql, binds);
//     console.log('쿼리 실행:', sql, binds);    
//     const [rows] = await pool.query(sql, binds);
//     console.log('쿼리 결과:', rows);
//     // 2. 성공 로그
//     const rowCount = Array.isArray(rows) ? rows.length : 0;
//     await Logger.logQuerySuccess(logEntry, rowCount)    
//     return rows as any[];
//   } catch (error) {
//     console.log('쿼리 결과:', error); 
//     // 3. 에러 로그
//     await Logger.logQueryError(logEntry, error)
//     throw error
//   } 
// }
/**
 * 쿼리 실행 (PL/SQL) - 수정됨!
 */
async function execPlsql(sql: string, binds: Record<string, any>, options: any = {}): Promise<any> {
}

/**
 * INSERT/UPDATE/DELETE (DML)
 */
async function execute(conn: PoolConnection | null = null, sql: string, bind: any[] = []): Promise<any> {
  // 1. 쿼리 시작 로그
  try {  
    if (!pool) 
      throw new Error('DB 풀이 초기화되지 않았습니다.');
    const logEntry = await Logger.logQueryStart(sql, bind);
    await (conn ? conn.query(sql, bind) : pool.query(sql, bind));
    await Logger.logQuerySuccess(logEntry, 0);    
  }
  catch (error) {
    // 2. 에러 로그
    await Logger.logQueryError(null, error)
    throw error
  }
}

// =================================================================================================================
// DB에서 데이터를 조회하여 반환하는 함수들 (원시 데이터 조회)
// =================================================================================================================
// 1. 메뉴 조회 - 메뉴와 서브메뉴를 각각 조회한 후, 자바스크립트에서 조합하여 반환
async function _getSubMenus(P_NAV_ID: string = ''): Promise<any[]> {
  return select(`
SELECT  NAV_ID,
        NAS_ID,
        NAS_NAME,
        NAS_HREF,
        NAS_DESC 
FROM    T_NAV_SUB_ITEM
WHERE   NAV_ID = ?
ORDER BY NAV_ID, NAS_ID
`, [P_NAV_ID]);
}
export const getSubMenus = async (P_NAV_ID: string = ''): Promise<NavSubItem[]> => {
  const records = await _getSubMenus(P_NAV_ID);
  // 1단계: 메뉴 객체 생성
  return records.map((record: any) => ({      
    NAS_ID: record.NAS_ID,
    NAS_NAME: record.NAS_NAME || '',
    NAS_HREF: record.NAS_HREF || '',
    NAS_DESC: record.NAS_DESC || ''
  }));
}
async function _getMenus(): Promise<any[]> {
  return select(`
SELECT  NAV_ID, 
        NAV_NAME, 
        NAV_IMG, 
        NAV_DESC 
FROM    T_NAV_ITEM
`);
}
export const getMenus = async (): Promise<NavItem[]> => {
  const records = await _getMenus();
  // 1단계: NavItem[]로 변환 (map 사용!)
  let menus: NavItem[] = records.map((record: any) => ({
    NAV_ID: record.NAV_ID,
    NAV_NAME: record.NAV_NAME || '',
    NAV_IMG: record.NAV_IMG || '',
    NAV_DESC: record.NAV_DESC || '',
    NAV_SUB_MENUS: []  // 빈 배열 초기화
  }));
  // 2단계: 병렬로 모든 서브메뉴 로드
  await Promise.all(
    menus.map(async (menu) => {
      menu.NAV_SUB_MENUS = await getSubMenus(menu.NAV_ID);
    })
  );
  return menus;
}
async function _getMember(P_MEM_ID: string): Promise<any> {
  return select(`
SELECT	A.MEM_ID_ACT,
        A.MEM_NAME,
        A.MEM_NICKNAME,
        A.MEM_IMG,
        C.MIN_NAME MEM_SEX,
        A.MEM_AGE,
        A.MEM_POINT,
        A.MEM_EXP_POINT,
        A.MEM_LVL,
        A.MES_ID,
        B.MES_NAME 
FROM	T_MEMBER A
JOIN	T_MEMBERSHIP B ON B.MES_ID = A.MES_ID 
JOIN 	T_MINOR_DESC C ON C.COD_ID = 'COD00003' AND C.MIN_ID = A.MEM_SEX
WHERE A.MEM_ID = ?
`, [P_MEM_ID]);
}
export const getMember = async (P_MEM_ID: string): Promise<Member> => {
  const record = await _getMember(P_MEM_ID);
  return record.length > 0 ? {
    MEM_ID_ACT: record[0].MEM_ID_ACT,
    MEM_NAME: record[0].MEM_NAME,
    MEM_NICKNAME: record[0].MEM_NICKNAME,
    MEM_IMG: record[0].MEM_IMG,
    MEM_SEX: record[0].MEM_SEX,
    MEM_AGE: record[0].MEM_AGE,
    MEM_POINT: record[0].MEM_POINT,
    MEM_EXP_POINT: record[0].MEM_EXP_POINT,
    MEM_LVL: record[0].MEM_LVL,
    MES_ID: record[0].MES_ID,
    MES_NAME: record[0].MES_NAME
  } : {
    MEM_ID_ACT: '',
    MEM_NAME: '',
    MEM_NICKNAME: '',
    MEM_IMG: '',
    MEM_SEX: '',
    MEM_AGE: 0,
    MEM_POINT: 0,
    MEM_EXP_POINT: 0,
    MEM_LVL: 0,
    MES_ID: '',
    MES_NAME: ''    
  };
}
async function _getWorkoutDetails(P_WOR_ID: string = ''): Promise<any[]> {
  return select(`
    SELECT  B.WOO_ID, 
            B.WOO_NAME, 
            B.WOO_GUIDE, 
            B.WOO_IMG, 
            B.WOO_TARGET_UNIT,
            A.WOD_TARGET_REPS,
            A.WOD_TARGET_SETS
    FROM    T_WORKOUT_DETAIL A
    JOIN    T_WORKOUT B ON B.WOO_ID = A.WOO_ID
    WHERE   A.WOR_ID = ?
    `, [P_WOR_ID]);
}
export const getWorkoutDetails = async (P_WOR_ID: string = ''): Promise<WorkoutDetail[]> => {
  const records = await _getWorkoutDetails(P_WOR_ID);
  return records.map((rec: any) => ({
    WOO_ID : rec.WOO_ID,
    WOO_NAME : rec.WOO_NAME,
    WOO_GUIDE : rec.WOO_GUIDE,
    WOO_IMG : rec.WOO_IMG,
    WOO_TARGET_UNIT : rec.WOO_TARGET_UNIT,
    WOD_TARGET_REPS : rec.WOD_TARGET_REPS,
    WOD_TARGET_SETS : rec.WOD_TARGET_SETS
  }));
}
async function _getMenuPos(P_NAS_PAGE: string = ''): Promise<any[]> {
  return select(`
SELECT JSON_OBJECT(
       'NAV_ID',   A.NAV_ID,
       'NAS_ID',   A.NAS_ID,
       'NAV_NAME', B.NAV_NAME,
       'NAS_NAME', A.NAS_NAME,
       'NAS_SIBLINGS',
         COALESCE(
           (
             SELECT JSON_ARRAYAGG(
                      JSON_OBJECT(
                        'NAS_ID',   S.NAS_ID,
                        'NAS_NAME', S.NAS_NAME,
                        'NAS_HREF', S.NAS_HREF
                      )
                    )
             FROM   T_NAV_SUB_ITEM S
             WHERE  S.NAV_ID = A.NAV_ID
           ),
           JSON_ARRAY()
         )
     ) AS RESULT
FROM   T_NAV_SUB_ITEM A
JOIN   T_NAV_ITEM B
  ON   B.NAV_ID = A.NAV_ID
WHERE  A.NAS_PAGE = ?
`, [P_NAS_PAGE]);
}
export const getMenuPos = async (P_NAS_PAGE: string = ''): Promise<any> => {
  const result = await _getMenuPos(P_NAS_PAGE);
  return result.length > 0 ? result[0].RESULT : null;
}
async function _getWorkoutHistory(P_MEM_ID: string = ''): Promise<any> {
  return select(`
WITH RECURSIVE DATE_RANGE AS (
	SELECT CURDATE() - INTERVAL 7 DAY AS DATE_VAL
	UNION ALL
	SELECT DATE_VAL + INTERVAL 1 DAY
	FROM   DATE_RANGE
	WHERE  DATE_VAL + INTERVAL 1 DAY <= CURDATE()
)
SELECT	JSON_ARRAYAGG(
            JSON_OBJECT(
                'WO_DT', A.DATE_VAL,
                'STATUS', CASE WHEN B.WOR_DT IS NOT NULL THEN 'G' ELSE 'B' END
            )  
        ) AS RESULT   
FROM	DATE_RANGE A
LEFT JOIN T_WORKOUT_RECORD B
ON   B.WOR_DT = A.DATE_VAL
AND  B.MEM_ID = ?
`, [P_MEM_ID]);
}
export const getWorkoutHistory = async (P_MEM_ID: string = ''): Promise<any> => {
  const result = await _getWorkoutHistory(P_MEM_ID);
  return result.length > 0 ? result[0].RESULT : null;
}
async function _getWorkouts(): Promise<any> {
  return select(`
SELECT	WOO_ID, 
		    WOO_NAME, 
        WOO_IMG,
        WOO_GUIDE,
        WOO_TARGET_UNIT,
        WOO_TARGET_REPS,
        WOO_TARGET_SETS
FROM	  T_WORKOUT
`, []);
}
export const getWorkouts = async (): Promise<Workout[]> => {
  const records = await _getWorkouts();
  return records.map((rec: any) => ({
    WOO_ID : rec.WOO_ID,
    WOO_NAME : rec.WOO_NAME,
    WOO_GUIDE : rec.WOO_GUIDE,
    WOO_IMG : rec.WOO_IMG,
    WOO_TARGET_UNIT : rec.WOO_TARGET_UNIT,
    WOO_TARGET_REPS : rec.WOO_TARGET_REPS,
    WOO_TARGET_SETS : rec.WOO_TARGET_SETS
  }));
}












async function _searchRawSubMenus(key: string = ''): Promise<any[]> {
  if (!key?.trim() || key.trim().length < 2) {
    return [];  
  }
  const cleanKey = key.trim();
  return select(`
SELECT NAV_ID,
       NAS_ID,
       NAS_NAME,
       NAS_HREF,
       NAS_DESC
  FROM T_NAV_SUB_ITEM
 WHERE NAS_NAME LIKE CONCAT('%', UPPER(?), '%') 
    OR NAS_DESC LIKE CONCAT('%', UPPER(?), '%')
 ORDER BY 
       NAV_ID,
       NAS_ID;
`, [cleanKey, cleanKey]);
}
export const searchSubMenus = async (key: string = ''): Promise<NavSubItem[]> => {
  const subMenus = await _searchRawSubMenus(key);
  return subMenus.map((sub: any) => ({
    NAS_ID: sub.NAS_ID,
    NAS_NAME: sub.NAS_NAME,
    NAS_HREF: sub.NAS_HREF,
    NAS_DESC: sub.NAS_DESC
  }));
}
// 2. 칼럼정의 조회 - 테이블명으로 칼럼정의 조회 (칼럼명은 소문자로 반환)
async function _getColDescs(tableName: string): Promise<any[]> {
  return select(`
SELECT COL_ID,       
       COL_NAME,
       COL_TYPE,
       COL_WIDTH,
       COL_SUM
  FROM T_COLUMN_DESC
 WHERE COL_TBL_NAME = ?
 ORDER BY 
       COL_SEQ;
`, [tableName]);
}
// 3 운동내역 조회 
async function _getWorkoutRecords(memberId: string, from: string, to: string): Promise<any[]> {
  return select(`
SELECT  CONCAT(A.wkr_id, '-', B.wko_id) AS id,
        b.wko_id workout_id,
        a.wkr_dt wo_dt,
        c.wko_name title,
        MOD(CAST(SUBSTR(B.wko_id, 2) AS SIGNED) - 1, 5) title_color, 
        b.wkd_target_reps target_reps,
        b.wkd_target_sets target_sets,
        b.wkd_count count,
        b.wkd_target_reps * b.wkd_target_sets AS count_p,  
        CASE 
          WHEN (b.wkd_target_reps * b.wkd_target_sets - b.wkd_count) < 0 
          THEN 0 
          ELSE (b.wkd_target_reps * b.wkd_target_sets - b.wkd_count) 
        END AS count_s,        
        B.wkd_point point,
        A.wkr_desc description
FROM    t_workout_record A
JOIN    t_workout_detail B ON B.wkr_id = A.wkr_id
JOIN    t_workout C ON C.wko_id = B.wko_id
WHERE   A.mem_join_id = ?
AND     A.wkr_dt >= ?
AND     A.wkr_dt <= ?
`, [memberId, from, to]);
}
async function _getWorkoutPivot(memberId: string, from: string, to: string): Promise<any> {
  const binds = {
    member_id: memberId,
    from_dt: from,
    to_dt: to,
    json: { dir: oracledb.BIND_OUT, type: oracledb.CLOB }
  };
  return execPlsql(`
BEGIN
  usp_get_workout_pivot_json(
    :member_id,
    :from_dt,
    :to_dt,
    :json
  );
END;
`, binds);
}
async function _getWorkoutPivotWithPlan(memberId: string, from: string, to: string): Promise<any> {
  const binds = {
    member_id: memberId,
    from_dt: from,
    to_dt: to,
    json: { dir: oracledb.BIND_OUT, type: oracledb.CLOB }
  };
  return execPlsql(`
BEGIN
  usp_get_workout_pivot_with_plan_json(
    :member_id,
    :from_dt,
    :to_dt,
    :json
  );
END;
`, binds);
}

// 4. 회원 정보 조회 (예시)

async function _isMember(memberId: string): Promise<boolean> {
  const result = await select(`
SELECT A.id
FROM member A
WHERE A.id = :1
`, [memberId]);
  return result.length > 0;
}
async function _checkMember(memberId: string, password: string): Promise<string> {
  console.log('_checkMember:', memberId, password);
  const binds = {
    id: memberId,
    password: password,
    json: { dir: oracledb.BIND_OUT, type: oracledb.CLOB }
  };
  return execPlsql(`
BEGIN
  member_login(
    :id,
    :password,
    :json
  );
END;
`, binds);
}

// =================================================================================================================
// DB에서 읽어들인 데이터를 객체 데이터로 변환하여 반환하는 함수들
// =================================================================================================================
// 2. 메뉴 조회 

// 3. 메뉴 검색

// 4. 메뉴 검색

// 4. Column Description 조회
export const getColDescs = async (tableName: string): Promise<ColDesc[]> => {
  const colDescs = await _getColDescs(tableName);
  return colDescs.map((col: any) => ({      
    id: col.ID,
    title: col.TITLE,     
    type: col.TYPE,
    width: col.WIDTH,
    summary: col.SUMMARY,
    aggregate: 0
  }));
} 
// 5. 운동내역 조회
export const getWorkoutRecords = async (memberId: string, from: string, to: string): Promise<WorkoutRecord[]> => {
  const records = await _getWorkoutRecords(memberId, from, to);
  return records.map((rec: any) => ({
    id: rec.ID,
    workout_id: rec.WORKOUT_ID,
    wo_dt: rec.WO_DT,
    title: rec.TITLE,
    title_color: rec.TITLE_COLOR,
    target_reps: rec.TARGET_REPS,
    target_sets: rec.TARGET_SETS,
    count: rec.COUNT,
    count_p: rec.COUNT_P,
    count_s: rec.COUNT_S,
    point: rec.POINT,
    description: rec.DESCRIPTION
  }));
}
// 6. 운동내역 피벗 조회
export const getWorkoutPivot = async (memberId: string, from: string, to: string): Promise<ChartData> => {
  const result = await _getWorkoutPivot(memberId, from, to);
  // 3. ChartData 타입 반환
  return {
    columns: result.columns,
    data: result.data
  } as ChartData;
}
// 7. 운동내역 피벗 조회 (플랜 포함)
export const getWorkoutPivotWithPlan = async (memberId: string, from: string, to: string): Promise<ChartData> => {
  const result = await getRawWorkoutPivotWithPlan(memberId, from, to);
  // 3. ChartData 타입 반환
  return {
    columns: result.columns,
    data: result.data
  } as ChartData;
}
// 8. 운동내역 히스토리 조회

// 9. 운동내역 상세 조회

// 10. 회원정보 조회

// 12. 회원정보 검증
export const checkMember = async (memberId: string, password: string): Promise<MemberExists> => {
  console.log('_isMember:', memberId, password);
  const bool = await _isMember(memberId);
  if(!bool) {
    return {
      status: "FAIL",  
      error: '회원정보가 존재하지 않습니다.'
    };
  }
  console.log('_checkMember:', memberId);  
  const status = await _checkMember(memberId, password);
  if(status == "FAIL") {
    return {
      status: status,  
      error: '비밀번호가 올바르지 않습니다.'
    };
  }
  return {
    status: status,
    error: ''
  };
} 