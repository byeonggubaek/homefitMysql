import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { NavItem, NavSubItem, ColDesc, WorkoutRecord, ChartData, MenuPos, WorkoutHistory, Member, WorkoutDetail, MemberExists } from 'shared';
import dotenv from 'dotenv';
import Logger from './logger.js'

// 환경 변수 로드
dotenv.config();

let pool: Pool | null = null;

// 1. 커넥션 풀 생성
export async function initPool(): Promise<void> {
  if (pool) return;
  try {
    pool = await mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('DB풀을 생성하였습니다.');
    await Logger.log('i', 'DB풀 생성 성공');
  } catch (error) {
    console.log('DB풀을 생성하지 못했습니다.', (error as Error).message || error);
    await Logger.logError('DB풀 생성 실패', (error as Error).message || error);
    throw error;
  }
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
async function select(sql: string, binds: any[] = []): Promise<any[]> {
  let logEntry = null;
  let connection = null;
  try {
    // 1. 쿼리 시작 로그
    if (!pool) 
      throw new Error('DB 풀이 초기화되지 않았습니다.');
    logEntry = await Logger.logQueryStart(sql, binds);
    const [rows] = await pool.query(sql, binds);
    // 2. 성공 로그
    const rowCount = Array.isArray(rows) ? rows.length : 0;
    await Logger.logQuerySuccess(logEntry, rowCount)    
    return rows as any[];
  } catch (error) {
    // 3. 에러 로그
    await Logger.logQueryError(logEntry, error)
    throw error
  } 
}
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
async function _getMenus(): Promise<any[]> {
  return select(`
SELECT  NAV_ID, 
        NAV_NAME, 
        NAV_IMG, 
        NAV_DESC 
FROM    T_NAV_ITEM
`);
}
async function _getSubMenus(nav_id: string = ''): Promise<any[]> {
  return select(`
SELECT  NAV_ID,
        NAS_ID,
        NAS_NAME,
        NAS_HREF,
        NAS_DESC 
FROM    T_NAV_SUB_ITEM
WHERE   NAV_ID = :1
ORDER BY NAV_ID, NAS_ID
`, [nav_id]);
}
export const getMenus = async (title: string = ''): Promise<NavItem[]> => {
  const menus = await _getMenus();
  // 메뉴 맵 생성
  const menuMap = new Map<string, NavItem>();
  // 1단계: 메뉴 객체 생성
  menus.forEach((menu: any) => {
    const navItem: NavItem = {
      NAV_ID: menu.NAV_ID,
      NAV_NAME: menu.NAV_NAME || '',
      NAV_IMG: menu.NAV_IMG || '',
      NAV_DESC: menu.NAV_DESC || '',
      NAV_SUB_MENUS: []
    };
    menuMap.set(navItem.NAV_ID, navItem);
  });
  
  // 2단계: 서브메뉴 연결 (1-1 → id="1"에 추가)
  menus.forEach((menu: any) => {
    menu.NAV_SUB_MENUS = _getSubMenus(menu.NAV_ID); // 각 메뉴의 서브메뉴 조회  
  });
  return Array.from(menuMap.values());
}

async function _getCurMenuPos(page: string = ''): Promise<any[]> {
  return select(`
SELECT 
  JSON_OBJECT(
    'NAV_ID', A.NAV_ID,
    'NAS_ID', A.NAS_ID,
    'NAV_NAME', B.NAV_NAME,
    'NAS_NAME', A.NAS_NAME,
    'SIBLINGS',
      COALESCE(
        (
          SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                      'NAS_ID', S.NAS_ID,
                      'NAS_NAME', S.NAS_NAME,
                      'NAS_HREF', S.NAS_HREF
                    )
                  )
          FROM T_NAV_SUB_ITEM S
          WHERE S.NAV_ID = A.NAV_ID
        ),
        JSON_ARRAY()
      )
  ) AS RESULT
FROM T_NAV_SUB_ITEM A
JOIN T_NAV_ITEM B ON B.NAV_ID = A.NAV_ID
AND A.NAS_HREF = ?
`, [page]);
}
export const getCurMenuPos = async (page: string = ''): Promise<MenuPos> => {
  const result = await _getCurMenuPos(page);
  const parsedResult = JSON.parse(result[0].RESULT);  // 문자열 → 객체
  return parsedResult as MenuPos;
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
async function _getWorkoutHistory(memberId: string = ''): Promise<any[]> {
  return select(`
WITH date_range AS (
    SELECT TRUNC(SYSDATE) - 7 + LEVEL AS date_val  -- 7일전부터 오늘
    FROM DUAL 
    CONNECT BY LEVEL < 8  -- (7일전~오늘)
)
SELECT  JSON_ARRAYAGG(
            JSON_OBJECT(
                'wo_dt' VALUE TO_CHAR(date_val, 'MM-DD'),
                'status' VALUE CASE WHEN b.wo_dt IS NOT NULL THEN 'G' ELSE 'B' END
            )  ORDER BY A.date_val  -- date_val 정렬 추가
        ) AS result    
FROM    date_range A
LEFT JOIN workout_record B ON B.wo_dt = A.date_val AND B.member_id = :1
`, [memberId]);
}
async function _getWorkoutDetail(workoutRecordId: string = ''): Promise<any[]> {
  return select(`
SELECT  B.title,
        B.guide,
        B.img,
        A.target_reps,
        A.target_sets
FROM    workout_detail A
JOIN    workout B ON B.id = A.workout_id
WHERE   A.workout_record_id = :1
`, [workoutRecordId]);
}
// 4. 회원 정보 조회 (예시)
async function _getMember(memberId: string): Promise<any> {
  return select(`
SELECT
    A.id,
    A.name,
    A.img,
    A.sex,
    A.age,
    A.point,
    A.exp_point,
    A.lvl,
    A.membership,
    B.name membership_name
FROM member A
JOIN minor_desc B on B.code_id = 'C0004' AND B.id = A.membership
WHERE A.id = :1
`, [memberId]);
}
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
export const getWorkoutHistory = async (memberId: string = ''): Promise<WorkoutHistory[]> => {
  const result = await _getWorkoutHistory(memberId);
  const parsedResult = JSON.parse(result[0].RESULT);  // 문자열 → 객체
  return parsedResult as WorkoutHistory[];
}
// 9. 운동내역 상세 조회
export const getWorkoutDetail = async (workoutRecordId: string = ''): Promise<WorkoutDetail[]> => {
  const records = await _getWorkoutDetail(workoutRecordId);
  return records.map((rec: any) => ({
    title: rec.TITLE,
    guide: rec.GUIDE,
    img: rec.IMG,
    target_reps: rec.TARGET_REPS,
    target_sets: rec.TARGET_SETS
  }));
}
// 10. 회원정보 조회
export const getMember = async (memberId: string): Promise<Member> => {
  const record = await _getMember(memberId);
  console.log('Raw member data from DB:', record);
  return {
    id: record[0].ID,
    name: record[0].NAME,
    password: '',  // 보안을 위해 비밀번호는 반환하지 않음
    img: record[0].IMG,
    sex: record[0].SEX,
    age: record[0].AGE,
    point: record[0].POINT,
    exp_point: record[0].EXP_POINT,
    lvl: record[0].LVL,
    membership: record[0].MEMBERSHIP,
    membership_name: record[0].MEMBERSHIP_NAME
  };
}
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