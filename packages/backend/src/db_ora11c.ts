// oracle-pool.ts (에러 수정 완료)
import oracledb from 'oracledb';
import { NavItem, NavSubItem, ColDesc, WorkoutRecord, ChartData, MenuPos, WorkoutHistory, Member, WorkoutDetail, MemberExists } from 'shared';
import dotenv from 'dotenv';
import Logger from './logger.js'

// 환경 변수 로드
dotenv.config();

oracledb.initOracleClient({libDir: 'C:\\oracle\\instantclient_23_0'});

const DB_CONFIG = {
  user: process.env.DB_USER,
  password: process.env.DB_USER_PASSWORD,
  connectString: `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SERVICE_NAME}`,
  poolMin: 1,
  poolMax: 10,
  poolIncrement: 1
};

let pool: any = null;

export async function initPool(): Promise<void> {
  if (pool) return;
  try {
    oracledb.fetchAsString = [oracledb.CLOB];    
    pool = await oracledb.createPool(DB_CONFIG);
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
    await pool.close(5000); // 5초 내 정리
    console.log('DB풀을 종료하였습니다.');
    await Logger.log('i', 'DB풀 종료 성공');
  } catch (error) {
    console.log('DB풀을 종료하지 못했습니다.', (error as Error).message || error);
    await Logger.logError('DB풀 종료 실패', (error as Error).message || error);
    throw error;
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
    await initPool();
    connection = await pool!.getConnection();    
    logEntry = await Logger.logQueryStart(sql, binds);
    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    // 2. 성공 로그
    await Logger.logQuerySuccess(logEntry, result.rows.length)    
    return result.rows as any[];
  } catch (error) {
    // 3. 에러 로그
    await Logger.logQueryError(logEntry, error)
    throw error
  } finally {
    if (connection) 
      await connection.close();
  }
}
/**
 * 쿼리 실행 (PL/SQL) - 수정됨!
 */
async function execPlsql(sql: string, binds: Record<string, any>, options: any = {}): Promise<any> {
  let logEntry = null;
  let connection = null;
  try {
    // 1. 쿼리 시작 로그
    await initPool();
    connection = await pool!.getConnection();    
    logEntry = await Logger.logQueryStart(sql, binds);

    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options
    });
    // 2. 성공 로그
    await Logger.logQuerySuccess(logEntry, result.rowsAffected || 0);
    // JSON CLOB 자동 처리
    if (result.outBinds?.json) {
      const clob = result.outBinds.json as oracledb.Lob;      
      const jsonData = await clob.getData();
      const jsonString = typeof jsonData === 'string' ? jsonData : jsonData.toString();
      return JSON.parse(jsonString);
    }
    return result.outBinds || result.rows || [];
  } catch (error) {
    // 3. 에러 로그
    console.log('Executing PL/SQL with binds: 실패', '에러:', (error as Error).message || error);
    await Logger.logQueryError(logEntry, error)
    throw error
  } finally {
    if (connection) 
      await connection.close();
  }
}

/**
 * INSERT/UPDATE/DELETE (DML)
 */
async function execute(sql: string, binds: any[] = []): Promise<any> {
  let logEntry = null;
  let connection = null;  
  try {
    await initPool();
    connection = await pool!.getConnection();
    logEntry = await Logger.logQueryStart(sql, binds);
    const result = await connection.execute(sql, binds, {
      autoCommit: true,
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });
    await Logger.logQuerySuccess(logEntry, result.rowsAffected || 0);
    return result;
  } catch (error) {
    // 3. 에러 로그
    await Logger.logQueryError(logEntry, error)
    throw error
  } finally {    
    if (connection) 
      await connection.close();
  }
}

// =================================================================================================================
// DB에서 데이터를 조회하여 반환하는 함수들 (원시 데이터 조회)
// =================================================================================================================
// 1. 메인 메뉴 조회 
async function _getMenus(): Promise<any[]> {
  return select(`
SELECT  nav_id, 
        nav_name, 
        nav_img, 
        nav_desc
FROM    t_nav_item
`);
}
// 2. 서브 메뉴 조회 (메뉴명으로 검색)
async function _getSubMenus(nav_id: string = ''): Promise<any[]> {
  return select(`
SELECT  nas_id AS nas_id, 
        nas_name, 
        nas_href, 
        nas_desc 
FROM    t_nav_sub_item
WHERE   nav_id = :1
ORDER BY nav_id, nas_id
`, [nav_id]);
}
// 3. 현재 페이지에 해당하는 메뉴 위치 조회
async function _getCurMenuPos(page: string = ''): Promise<any[]> {
  return select(`
SELECT  B.nav_id,
        B.nav_name,
        A.nas_id,
        A.nas_name
FROM    t_nav_sub_item A 
JOIN    t_nav_item B ON B.nav_id = A.nav_id 
WHERE   A.nas_page = :1
`, [page]);
}
// 4. 메뉴 검색 (메뉴명과 설명에서 검색)
async function _searchSubMenus(key: string = ''): Promise<any[]> {
  if (!key?.trim() || key.trim().length < 2) {
    return [];  
  }
  const cleanKey = key.trim();
  return select(`
SELECT  nav_id || '-' || nas_id AS nas_id, 
        nas_name,
        nas_href, 
        nas_desc
FROM    t_nav_sub_item
WHERE   nas_name LIKE '%' || UPPER(:1) || '%' OR nas_desc LIKE '%' || UPPER(:2) || '%'
ORDER BY nav_id, nas_id
`, [cleanKey, cleanKey]);
}
// 5. 칼럼정의 조회 - 테이블명으로 칼럼정의 조회 (칼럼명은 소문자로 반환)
async function _getColDescs(tableName: string): Promise<any[]> {
  return select(`
SELECT  Lower(col_id) AS col_id,  -- 중요함: 칼럼명을 소문자로 변환하여 반환
        col_name,
        col_type,
        col_width,
        col_sum
FROM    t_column_desc
WHERE   col_tbl_name = :1
ORDER BY col_seq
`, [tableName]);
}
// 6. 운동내역 조회 
async function _getWorkoutDetails(mem_join_id: string, from: string, to: string): Promise<any[]> {
  return select(`
SELECT  A.wor_id || '-' || B.woo_id AS id,
        A.wor_dt,
        B.woo_id,
        c.woo_name,
        MOD(TO_NUMBER(SUBSTR(B.woo_id, 4)) -1, 5) AS woo_name_color, 
        B.wod_target_reps,
        B.wod_target_sets,
        B.wod_count,
        B.wod_target_reps * B.wod_target_sets AS wod_count_p,  
        CASE 
          WHEN (B.wod_target_reps * B.wod_target_sets - B.wod_count) < 0 
          THEN 0 
          ELSE (B.wod_target_reps * B.wod_target_sets - B.wod_count) 
        END AS wor_count_s,        
        B.wod_point,
        A.wor_desc
FROM    t_workout_record A
JOIN    t_workout_detail B ON B.wor_id = A.wor_id
JOIN    t_workout C ON C.woo_id = B.woo_id
WHERE   A.mem_join_id = :1
AND     A.wor_dt >= :2
AND     A.wor_dt <= :3
`, [mem_join_id, from, to]);
}
async function _getWorkoutPivot(mem_join_id: string, from: string, to: string): Promise<any> {
  const binds = {
    mem_join_id: mem_join_id,
    from_dt: from,
    to_dt: to,
    result: { dir: oracledb.BIND_OUT, type: oracledb.CLOB }
  };
  return execPlsql(`
BEGIN
  usp_get_workout_pivot_json(
    :mem_join_id,
    :from_dt,
    :to_dt,
    :result
  );
END;
`, binds);
}
async function _getWorkoutPivotWithPlan(mem_join_id: string, from: string, to: string): Promise<any> {
  const binds = {
    mem_join_id: mem_join_id,
    from_dt: from,
    to_dt: to,
    result: { dir: oracledb.BIND_OUT, type: oracledb.CLOB }
  };
  return execPlsql(`
BEGIN
  usp_get_workout_pivot_with_plan_json(
    :mem_join_id,
    :from_dt,
    :to_dt,
    :result
  );
END;
`, binds);
}
async function _getWorkoutHistory(mem_join_id: string = ''): Promise<any[]> {
  return select(`
WITH date_range AS (
    SELECT TRUNC(SYSDATE) - 7 + LEVEL AS date_val  -- 7일전부터 오늘
    FROM DUAL 
    CONNECT BY LEVEL < 8  -- (7일전~오늘)
)
SELECT  TO_CHAR(date_val, 'MM-DD') wo_dt, CASE WHEN b.wor_dt IS NOT NULL THEN 'G' ELSE 'B' END AS status
FROM    date_range A
LEFT JOIN t_workout_record B ON B.wor_dt = A.date_val AND B.mem_join_id = :1
`, [mem_join_id]);
}
async function _getWorkoutDetail(workoutRecordId: string = ''): Promise<any[]> {
  return select(`
SELECT  B.woo_id,
        B.woo_name,
        B.woo_guide,
        B.woo_img,
        A.wod_target_reps,
        A.wod_target_sets
FROM    t_workout_detail A
JOIN    t_workout B ON B.woo_id = A.woo_id
WHERE   A.wor_id = :1
`, [workoutRecordId]);
}
async function _getWorkouts(): Promise<any[]> {
  return select(`
SELECT  woo_id,
        woo_name,
        woo_guide,
        woo_img,
        0 wod_target_reps,
        0 wod_target_sets
FROM    t_workout

`, []);
}
// 4. 회원 정보 조회 (예시)
async function _getMember(memJoinId: string): Promise<any> {
  return select(`
SELECT
    A.mem_id,
    A.mem_name,
    A.mem_nickname,    
    A.mem_img,
    c.min_name mem_sex,
    A.mem_age,
    A.mem_point,
    A.mem_exp_point,
    A.mem_lvl,
    A.mes_id,
    B.mes_name
FROM t_member A
JOIN t_membership B on B.mes_id = A.mes_id  
JOIN t_minor_desc C on C.cod_id = 'COD00003' AND C.min_id = A.mem_sex
WHERE A.mem_join_id = :1
`, [memJoinId]);
}
async function _isMember(memJoinId: string): Promise<boolean> {
  const result = await select(`
SELECT  A.mem_join_id
FROM    t_member A
WHERE   A.mem_join_id = :1
`, [memJoinId]);
  return result.length > 0;
}
async function _checkMember(memID: string, memPassword: string): Promise<string> {
  console.log('_checkMember:', memID, memPassword);
  const binds = {
    mem_id: memID,
    mem_password: memPassword,
    json: { dir: oracledb.BIND_OUT, type: oracledb.CLOB }
  };
  return execPlsql(`
BEGIN
  member_login(
    :mem_id,
    :mem_password,
    :result
  );
END;
`, binds);
}

// =================================================================================================================
// DB에서 읽어들인 데이터를 객체 데이터로 변환하여 반환하는 함수들
// =================================================================================================================
// 2. 메뉴 조회 
const getSubMenus = async (nav_id: string = ''): Promise<NavSubItem[]> => {
  try {
    const subMenus = await _getSubMenus(nav_id);
    return subMenus.map((sub: any) => ({
      nas_id: sub.NAS_ID || '',
      nas_name: sub.NAS_NAME || '', 
      nas_href: sub.NAS_HREF || '',
      nas_desc: sub.NAS_DESC || ''
    }));
  } catch (error) {
    console.error('getSubMenus error:', error);
    return [];  // 빈 배열 반환
  }
}
export const getMenus = async (title: string = ''): Promise<NavItem[]> => {
 const menus = await _getMenus();
  
  // 1. 메뉴 맵 생성 및 기본 객체 추가
  const menuMap = new Map<string, NavItem>();
  menus.forEach((menu: any) => {
    menuMap.set(menu.NAV_ID, {
      nav_id: menu.NAV_ID,
      nav_name: menu.NAV_NAME || '',
      nav_img: menu.NAV_IMG || '',
      nav_desc: menu.NAV_DESC || '',
      sub_menus: []  // 초기 빈 배열
    });
  });
  
  // 2. 병렬로 모든 sub_menus 로드 (for...of + Promise.all)
  await Promise.all(
    Array.from(menuMap.values()).map(async (navItem) => {
      navItem.sub_menus = await getSubMenus(navItem.nav_id);
    })
  );
  return Array.from(menuMap.values());
}
// 4. 메뉴 검색
export const getCurMenuPos = async (page: string = ''): Promise<MenuPos> => {
  const menus = await _getCurMenuPos(page);  // page 파라미터 전달
  // 1. 첫 번째 행으로 메뉴 정보 설정 (현재 위치)
  const currentMenu = menus[0];
  let menupos: MenuPos = {
    nav_id: currentMenu.NAV_ID,
    nav_name: currentMenu.NAV_NAME || '',
    nas_id: currentMenu.NAS_ID || '',
    nas_name: currentMenu.NAS_NAME || '',
    siblings: []  // 초기 빈 배열
  };
  
  // 2. 같은 NAV_ID의 모든 서브메뉴 (형제들) 로드
  const siblings = await getSubMenus(menupos.nav_id);
  menupos.siblings = siblings;
  return menupos;
};

// 3. 메뉴 검색
export const searchSubMenus = async (key: string = ''): Promise<NavSubItem[]> => {
  const subMenus = await _searchSubMenus(key);
  return subMenus.map((sub: any) => ({
    nas_id: sub.NAS_ID,
    nas_name: sub.NAS_NAME,
    nas_href: sub.NAS_HREF,
    nas_desc  : sub.NAS_DESC
  }));
}
// 4. Column Description 조회
export const getColDescs = async (tableName: string): Promise<ColDesc[]> => {
  const colDescs = await _getColDescs(tableName);
  return colDescs.map((col: any) => ({      
    col_id: col.COL_ID,
    col_name: col.COL_NAME,     
    col_type: col.COL_TYPE,
    col_width: col.COL_WIDTH,
    col_sum: col.COL_SUM,
    col_agg: 0
  }));
} 
// 5. 운동내역 조회
export const getWorkoutDetails = async (memberId: string, from: string, to: string): Promise<WorkoutRecord[]> => {
  const records = await _getWorkoutDetails(memberId, from, to);
  return records.map((rec: any) => ({
    wor_id: rec.WOR_ID,
    wor_dt: rec.WOR_DT,
    woo_id: rec.WOO_ID,
    woo_name: rec.WOO_NAME,
    woo_name_color: rec.WOO_NAME_COLOR,
    wor_target_reps: rec.WOR_TARGET_REPS,
    wor_target_sets: rec.WOR_TARGET_SETS,
    wor_count: rec.WOR_COUNT,
    wor_count_p: rec.WOR_COUNT_P,
    wor_count_s: rec.WOR_COUNT_S,
    wor_point: rec.WOR_POINT,
    wor_desc: rec.WOR_DESC
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
  const result = await _getWorkoutPivotWithPlan(memberId, from, to);
  // 3. ChartData 타입 반환
  return {
    columns: result.columns,
    data: result.data
  } as ChartData;
}
// 8. 운동내역 히스토리 조회
export const getWorkoutHistory = async (memberId: string = ''): Promise<WorkoutHistory[]> => {
  const result = await _getWorkoutHistory(memberId);
  return result.map((rec: any) => ({
    wo_dt: rec.WO_DT,
    status: rec.STATUS,
  }));
}
// 9. 운동내역 상세 조회
export const getWorkoutDetail = async (workoutRecordId: string = ''): Promise<WorkoutDetail[]> => {
  const result = await _getWorkoutDetail(workoutRecordId);
  return result.map((rec: any) => ({
    woo_id: rec.WOO_ID,
    woo_name: rec.WOO_NAME,
    woo_guide: rec.WOO_GUIDE,
    woo_img: rec.WOO_IMG,
    wod_target_reps: rec.WOD_TARGET_REPS,
    wod_target_sets: rec.WOD_TARGET_SETS
  }));
}
// 9. 운동내역 상세 조회
export const getWorkouts = async (): Promise<WorkoutDetail[]> => {
  const result = await _getWorkouts();
  return result.map((rec: any) => ({
    woo_id: rec.WOO_ID,
    woo_name: rec.WOO_NAME,
    woo_guide: rec.WOO_GUIDE,
    woo_img: rec.WOO_IMG,
    wod_target_reps: rec.WOD_TARGET_REPS,
    wod_target_sets: rec.WOD_TARGET_SETS
  }));
}
// 10. 회원정보 조회
export const getMember = async (memberId: string): Promise<Member> => {
  const record = await _getMember(memberId);
  return {
    mem_id: record[0].MEM_ID,
    mem_name: record[0].MEM_NAME,
    mem_nickname: record[0].MEM_NICKNAME,
    mem_img: record[0].MEM_IMG,
    mem_sex: record[0].MEM_SEX,
    mem_age: record[0].MEM_AGE,
    mem_point: record[0].MEM_POINT,
    mem_exp_point: record[0].MEM_EXP_POINT,
    mem_lvl: record[0].MEM_LVL,
    mes_id: record[0].MES_ID,
    mes_name: record[0].MES_NAME
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