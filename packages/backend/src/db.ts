import mysql, { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { NavItem, NavSubItem, ColDesc, WorkoutRecord, ChartData, MenuPos, WorkoutHistory, Member, WorkoutDetail, MemberExists, Workout, BeneFun, Membership, Benefit, T_WORKOUT_RECORD, T_MEMBER, T_WORKOUT_DETAIL, RankingItem, CurWorkoutRecord, Goods } from 'shared';
import dotenv from 'dotenv';
import Logger from './logger.js'

// 환경 변수 로드
dotenv.config();

let pool: mysql.Pool | null = null;
let poolPromise: Promise<mysql.Pool> | null = null;

// =================================================================================================================
// DB 커넥션 풀 관리 및 원시 쿼리 실행 함수들
// =================================================================================================================
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
          multipleStatements: true,
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
// 2. 커넥션 풀 종료
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
// 3. 원시 쿼리 실행 - SELECT (결과 반환)
export async function select<T extends RowDataPacket = RowDataPacket>(
  sql: string, 
  binds: any[] = []
): Promise<T[]> {
  let logEntry: any = null;
  
  try {
    await initPool();
    logEntry = await Logger.logQueryStart(sql, binds);
    const [rows] = await pool!.query<T[]>(sql, binds);
    await Logger.logQuerySuccess(logEntry, rows.length || 0);    
    return rows as T[];
  } catch (error: any) {
    await Logger.logQueryError(logEntry, error.message || error);
    throw error;
  }
}
// 3. 원시 쿼리 실행 - SELECT (결과 반환)
export async function execute<T extends RowDataPacket = RowDataPacket>(
  conn: PoolConnection,
  sql: string, 
  binds: any[] = []
): Promise<any> {
  let logEntry: any = null;
  
  try {
    await initPool();
    logEntry = await Logger.logQueryStart(sql, binds);
    const result = await conn.execute<T[]>(sql, binds);
    await Logger.logQuerySuccess(logEntry, (result as any).affectedRows || 0);    
    return result;
  } catch (error: any) {
    await Logger.logQueryError(logEntry, error.message || error);
    throw error;
  }
}
// 4. 트랜잭션 처리 함수 - 트랜잭션이 필요한 작업을 이 함수 안에서 실행하도록 래핑
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
// =================================================================================================================
// DB에서 읽어들인 데이터를 객체 데이터로 변환하여 반환하는 함수들
// =================================================================================================================
// 0. DB 
// =================================================================================================================
// 0.1. DB 스키마 
async function _getScript(tableName: string): Promise<any> {
  try {
    // 테이블이 없으면 여기서 에러가 발생하므로 try-catch로 감쌉니다.
    return await select(`SHOW CREATE TABLE ${tableName}`);
  } catch (error) {
    // 테이블이 없는 경우 콘솔에 로그만 남기고 null을 반환하여 스킵 준비를 합니다.
    console.warn(`Table not found: ${tableName}`);
    return null;
  }
}
export const getScripts = async (tableNames: string[]): Promise<string> => {
  // 1. DB 조회를 병렬로 실행합니다.
  const rawResults = await Promise.all(tableNames.map(name => _getScript(name)));

  // 2. 결과 가공 및 유효성 검사
  const scriptStrings = rawResults.map((result) => {
    // result가 null이 아니고, 배열이며, 첫 번째 요소에 'Create Table'이 있는지 확인
    if (result && Array.isArray(result) && result.length > 0) {
      return result[0]['Create Table'] || "";
    }
    return ""; // 위 조건에 맞지 않으면(없는 테이블 등) 빈 문자열 반환
  });

  // 3. 빈 문자열을 필터링하고 하나로 합쳐서 반환합니다.
  return scriptStrings
    .filter(s => s.trim() !== "") // 실제 내용이 있는 스크립트만 남김
    .join('\n\n');
};
// 0.1. 컬럼 스키마 조회 
async function _getColDesc(): Promise<any[]> {
  const query = `
    SELECT COL_ID,       
           COL_NAME,
           COL_TYPE,
           COL_WIDTH,
           COL_SUM
    FROM T_COLUMN_DESC
    WHERE COL_TBL_NAME = 'WorkoutRecord'
    ORDER BY COL_SEQ
  `;
  return select(query, []);
}
export const getColDesc = async (): Promise<ColDesc[]> => {
  const records = await _getColDesc();
  // 데이터가 없을 경우 빈 배열 반환, 있을 경우 매핑하여 반환
  return records.map((record: any) => ({
    COL_ID: record.COL_ID,
    COL_NAME: record.COL_NAME,
    COL_TYPE: record.COL_TYPE,
    COL_WIDTH: Number(record.COL_WIDTH), // 숫자형 변환 보장
    COL_SUM: record.COL_SUM,
    COL_AGGREGATE: 0 // 초기값 0으로 설정 (필요에 따라 다른 초기값으로 변경 가능)
  }));
};
// =================================================================================================================
// 1. 메뉴 
// =================================================================================================================
// 1.1. 메뉴 조회 
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
async function _getMenus(mem_id: string): Promise<any[]> {
  if(!mem_id){
    return select(`
      SELECT  NAV_ID, 
              NAV_NAME, 
              NAV_IMG, 
              NAV_DESC 
      FROM    T_NAV_ITEM
      WHERE   NAV_ID = 'NAV09999'      
      `);
  }
  else{
    return select(`
      SELECT  NAV_ID, 
              NAV_NAME, 
              NAV_IMG, 
              NAV_DESC 
      FROM    T_NAV_ITEM
      `);
  }
}
export const getMenus = async (mem_id: string): Promise<NavItem[]> => {
  const records = await _getMenus(mem_id);
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
// 1.2. 빵부스러기 탐색
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
// 1.3. 메뉴 검색 - 메뉴명과 설명에서 키워드 검색하여 일치하는 서브메뉴 반환 (빵부스러기 메뉴 탐색과 유사하지만, 검색어로 필터링)
async function _searchMenus(key: string = ''): Promise<any[]> {
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
       NAS_ID
`, [cleanKey, cleanKey]);
}
export const searchMenus = async (key: string = ''): Promise<NavSubItem[]> => {
  const records = await _searchMenus(key);
  return records.map((record: any) => ({
    NAS_ID: record.NAS_ID,
    NAS_NAME: record.NAS_NAME,
    NAS_HREF: record.NAS_HREF,
    NAS_DESC: record.NAS_DESC
  }));
}
// =================================================================================================================
// 2. 회원
// =================================================================================================================
// 2.1. 회원 정보 조회 - 회원 ID로 회원 정보 조회 (로그인 후 마이페이지에서 사용)
async function _getMember(P_MEM_ID: string): Promise<any> {
  return select(`
SELECT A.MEM_ID,
       A.MEM_ID_VIEW,
       A.MEM_NAME,
       A.MEM_NICKNAME,
       A.MEM_IMG,
       A.MEM_PNUMBER,
       A.MEM_EMAIL,
       C.MIN_NAME AS MEM_SEX,
       A.MEM_AGE,
       A.MEM_POINT,
       A.MEM_EXP_POINT,
       A.MEM_LVL,
       A.MEM_STREAK,
       A.MES_ID,
       B.MES_NAME,
       B.MES_FEE
FROM T_MEMBER A
JOIN T_MEMBERSHIP B 
    ON B.MES_ID = A.MES_ID
JOIN T_MINOR_DESC C 
    ON C.COD_ID = 'COD00003' 
    AND C.MIN_ID = A.MEM_SEX
WHERE A.MEM_ID = ?
`, [P_MEM_ID]);
}
export const getMember = async (P_MEM_ID: string): Promise<Member[]> => {
  const records = await _getMember(P_MEM_ID);
  return records.length === 0 ? [] : [{
    MEM_ID: records[0].MEM_ID,
    MEM_ID_VIEW: records[0].MEM_ID_VIEW,
    MEM_NAME: records[0].MEM_NAME,
    MEM_NICKNAME: records[0].MEM_NICKNAME,
    MEM_IMG: records[0].MEM_IMG,
    MEM_PNUMBER: records[0].MEM_PNUMBER,
    MEM_EMAIL: records[0].MEM_EMAIL,
    MEM_SEX: records[0].MEM_SEX,
    MEM_AGE: records[0].MEM_AGE,
    MEM_POINT: records[0].MEM_POINT,
    MEM_EXP_POINT: records[0].MEM_EXP_POINT,
    MEM_LVL: records[0].MEM_LVL,
    MEM_STREAK: records[0].MEM_STREAK,
    MES_ID: records[0].MES_ID,
    MES_NAME: records[0].MES_NAME,
    MES_FEE: records[0].MES_FEE
  }];
}
// 2.2. 회원인지 검사 
async function _isMember(P_MEM_ID_VIEW: string): Promise<boolean> {
  const result = await select(`
SELECT  MEM_ID_VIEW
FROM    T_MEMBER A
WHERE   MEM_ID_VIEW = ?
`, [P_MEM_ID_VIEW]);
  return result.length > 0;
}
// 2.3. 회원 암호 확인
async function _checkMember(P_MEM_ID_VIEW: string, P_MEM_PASSWORD: string): Promise<Member[]> {
  const records = await select(`
  CALL member_login(?, ?)
`, [P_MEM_ID_VIEW, P_MEM_PASSWORD]);
  return records[0].length === 0 ? [] : 
    records[0].map((record: any) => ({
      MEM_ID: record.MEM_ID,
      MEM_ID_VIEW: record.MEM_ID_VIEW,
      MEM_NAME: record.MEM_NAME,
      MEM_NICKNAME: record.MEM_NICKNAME,
      MEM_IMG: record.MEM_IMG,
      MEM_PNUMBER: record.MEM_PNUMBER,
      MEM_EMAIL: record.MEM_EMAIL,
      MEM_SEX: record.MEM_SEX,
      MEM_AGE: record.MEM_AGE,
      MEM_POINT: record.MEM_POINT,
      MEM_EXP_POINT: record.MEM_EXP_POINT,
      MEM_LVL: record.MEM_LVL,
      MEM_STREAK: record.MEM_STREAK,
      MES_ID: record.MES_ID,
      MES_NAME: record.MES_NAME,
      MES_FEE: record.MES_FEE
    }));
}
// 2.4. 로그인 - 회원 ID와 비밀번호로 로그인 시도, 결과에 따라 성공/실패 여부와 메시지 반환 (로그인 API에서 사용)
export const login = async (P_MEM_ID_VIEW: string, P_MEM_PASSWORD: string): Promise<MemberExists> => {
  const bool = await _isMember(P_MEM_ID_VIEW);
  if(!bool) {
    return {
      STATUS: "FAIL",  
      ERROR: '회원정보가 존재하지 않습니다.'
    };
  }
  const records = await _checkMember(P_MEM_ID_VIEW, P_MEM_PASSWORD);
  if(!records || records.length === 0) {
    return {
      STATUS: "FAIL",  
      ERROR: '비밀번호가 올바르지 않습니다.',
    };  
  }
  else {
    return {
      STATUS: "SUCCESS",
      ERROR: '',
      USER: records[0]
    };
  }
} 
// 2.5. 회원등록 
export const insertMember = async (P_MEM: T_MEMBER): Promise<{ MEM_ID: number, MEM_ID_VIEW: string }> => {
    return await withTransaction(async (conn: PoolConnection) => {
      // 1. 회원 정보 최초 INSERT (MEM_ID_VIEW는 임시 빈 값)
      const [insertResult] = await execute(conn,
        `
        CALL member_signup(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @p_result, @p_new_id)
        `,
        [
            P_MEM.MEM_ID_VIEW, 
            P_MEM.MEM_NAME, 
            P_MEM.MEM_NICKNAME ?? null, 
            P_MEM.MEM_PASSWORD,
            P_MEM.MEM_IMG ?? null, 
            P_MEM.MEM_PNUMBER ?? null, 
            P_MEM.MEM_EMAIL ?? null, 
            P_MEM.MEM_SEX,
            P_MEM.MEM_AGE, 
            P_MEM.MES_ID
        ] as any[] // ExecuteValues 타입 에러 방지용 캐스팅
      );
      const [rows] = await execute(
        conn,
        `
        SELECT @p_result AS result, @p_new_id AS newId
        `, [] as any[]
      );
      // 생성된 AUTO_INCREMENT ID (PK) 추출
      const newId = (rows as any)[0].newId;
      const result = (rows as any)[0].result;        
      if (result !== 'SUCCESS') {
          throw new Error(result === 'DUPLICATE_ID' ? '이미 존재하는 회원 ID입니다.' : '회원가입에 실패했습니다.');
      }
      return { 
          MEM_ID: newId, 
          MEM_ID_VIEW: P_MEM.MEM_ID_VIEW
      };
    });
};
// 2.6. 혜택조회 
async function _getBenefits(P_MES_ID: string = ''): Promise<any[]> {
  return select(`
 SELECT B.BEN_ID, 
        B.BEN_NAME
  FROM  T_MEMBERSHIP_BENEFIT A
  JOIN  T_BENEFIT B
    ON  B.BEN_ID = A.BEN_ID
 WHERE  A.MES_ID = ?
`, [P_MES_ID]);
}
export const getBenefits = async (P_MES_ID: string = ''): Promise<Benefit[]> => {
  const records = await _getBenefits(P_MES_ID);
  // 1단계: 메뉴 객체 생성
  return records.map((record: any) => ({
    BEN_ID: record.BEN_ID,
    BEN_NAME: record.BEN_NAME || ''
  }));
}
// 2.6. 멤버쉽 조회  
async function _getMemberships(): Promise<any[]> {
  return select(`
  SELECT  MES_ID,
          MES_NAME,
          MES_FEE
  FROM    T_MEMBERSHIP
  WHERE   MES_ID <> 'MES00001'
`);
}
export const getMemberships = async (): Promise<Membership[]> => {
  const records = await _getMemberships();
  let memberships: Membership[] = records.map((record: any) => ({
    MES_ID: record.MES_ID,
    MES_NAME: record.MES_NAME || '',
    MES_FEE: record.MES_FEE || 0,
    MES_BENEFITS: []
  }));
  // 2단계: 병렬로 모든 서브메뉴 로드
  await Promise.all(
    memberships.map(async (membership) => {
      membership.MES_BENEFITS = await getBenefits(membership.MES_ID);
    })
  );
  return memberships;
}
// 2.7. 랭킹 조회 
async function _getRanking(from_dt: string = '', to_dt: string = ''): Promise<any[]> {
  return select(`
SELECT
    ROW_NUMBER() OVER (ORDER BY B.CNT DESC) AS \`RANK\`,
    A.MEM_ID,
    A.MEM_NAME,
    A.MEM_IMG,
    B.CNT,
    B.WORKOUT_TIME
FROM T_MEMBER A
JOIN (
    SELECT
        WR.MEM_ID,
        COUNT(*)             AS CNT,
        SUM(WD.WOD_TIME) AS WORKOUT_TIME
    FROM T_WORKOUT_RECORD WR
    JOIN T_WORKOUT_DETAIL WD
        ON WD.WOR_ID = WR.WOR_ID
    WHERE WR.WOR_DT >= ?
      AND WR.WOR_DT <= ?
    GROUP BY WR.MEM_ID
) B
    ON A.MEM_ID = B.MEM_ID
ORDER BY B.CNT DESC
`, [from_dt, to_dt]);
}
export const getRanking = async (from_dt: string = '', to_dt: string = ''): Promise<RankingItem[]> => {
  const subMenus = await _getRanking(from_dt, to_dt);
  return subMenus.map((sub: any) => ({
    RANK: sub.RANK,
    MEM_ID: sub.MEM_ID,
    MEM_NAME: sub.MEM_NAME,
    MEM_IMG: sub.MEM_IMG,
    CNT: sub.CNT,
    WORKOUT_TIME: sub.WORKOUT_TIME
  }));
}
// =================================================================================================================
// 3. 운동
// =================================================================================================================
// 3.1. 운동 목록 조회 - 모든 운동 목록 조회 (운동 기록 추가/수정 페이지에서 운동 선택용 데이터)
async function _getWorkouts(): Promise<any> {
  return select(`
SELECT  WOO_ID,
        WOO_ID_VIEW,
        WOO_NAME,
        WOO_IMG,
        WOO_DESC,
        WOO_GUIDE,
        WOO_UNIT,
        WOO_TARGET_REPS,
        WOO_TARGET_SETS
FROM T_WORKOUT
`, []);
}
export const getWorkouts = async (): Promise<Workout[]> => {
  const records = await _getWorkouts();
  return records.map((record: any) => ({
    WOO_ID : record.WOO_ID,
    WOO_NAME : record.WOO_NAME,
    WOO_GUIDE : record.WOO_GUIDE,
    WOO_IMG : record.WOO_IMG,
    WOO_UNIT : record.WOO_UNIT,
    WOO_TARGET_REPS : record.WOO_TARGET_REPS,
    WOO_TARGET_SETS : record.WOO_TARGET_SETS
  }));
}
// 3.2. 운동 상세 정보 조회 - 오늘의운동에서 사용. 
async function _getWorkoutDetails(P_WOR_ID: number): Promise<any[]> {
  return select(`
    SELECT  B.WOO_ID, 
            B.WOO_NAME, 
            B.WOO_IMG, 
            B.WOO_UNIT,
            COALESCE(NULLIF(A.WOD_GUIDE, ''), B.WOO_GUIDE) AS WOD_GUIDE,
            A.WOD_TARGET_REPS,
            A.WOD_TARGET_SETS
    FROM    T_WORKOUT_DETAIL A
    JOIN    T_WORKOUT B ON B.WOO_ID = A.WOO_ID
    WHERE   A.WOR_ID = ?
    `, [P_WOR_ID]);
}
export const getWorkoutDetails = async (P_WOR_ID: number): Promise<WorkoutDetail[]> => {
  const records = await _getWorkoutDetails(P_WOR_ID);
  return records.map((record: any) => ({
    WOO_ID : record.WOO_ID,
    WOO_NAME : record.WOO_NAME,
    WOO_IMG : record.WOO_IMG,
    WOO_UNIT : record.WOO_UNIT,
    WOD_GUIDE : record.WOD_GUIDE,
    WOD_TARGET_REPS : record.WOD_TARGET_REPS,
    WOD_TARGET_SETS : record.WOD_TARGET_SETS
  }));
}
// 3.3. 운동 기록 조회 - 회원 ID와 날짜 범위로 해당 기간의 운동 기록 조회 (운동 기록 조회 페이지에서 사용)
async function _getWorkoutRecords(mem_id: number, start_dt: string, end_dt: string): Promise<any[]> {
  return select(`
    SELECT  A.WOR_ID, 
            A.WOR_ID_VIEW,
            B.WOO_ID,
            A.WOR_DT,
            C.WOO_NAME,
            MOD(B.WOO_ID - 1, 5) AS WOO_NAME_COLOR, 
            B.WOD_TARGET_REPS,
            B.WOD_TARGET_SETS,
            B.WOD_COUNT,
            B.WOD_TARGET_REPS * B.WOD_TARGET_SETS AS WOD_COUNT_P,  
            CASE 
              WHEN (B.WOD_TARGET_REPS * B.WOD_TARGET_SETS - B.WOD_COUNT) < 0 
              THEN 0 
              ELSE (B.WOD_TARGET_REPS * B.WOD_TARGET_SETS - B.WOD_COUNT) 
            END AS WOD_COUNT_S,        
            B.WOD_POINT,
            A.WOR_DESC
    FROM    T_WORKOUT_RECORD A
    JOIN    T_WORKOUT_DETAIL B ON B.WOR_ID = A.WOR_ID
    JOIN    T_WORKOUT C ON C.WOO_ID = B.WOO_ID
    WHERE   A.MEM_ID = ?
    AND     A.WOR_DT >= ?
    AND     A.WOR_DT <= ?
    AND     A.WOR_STATUS = 'C'  -- 완료된 기록만 조회 (예: 'N' = Not completed, 'C' = Completed)  
    ORDER BY A.WOR_DT DESC, A.WOR_ID, B.WOO_ID
  `, [mem_id, start_dt, end_dt]);
}
export const getWorkoutRecords = async (mem_id: number, start_dt: string, end_dt: string): Promise<WorkoutRecord[]> => {
  const records = await _getWorkoutRecords(mem_id, start_dt, end_dt);
  return records.map((record: any) => ({
    WOR_ID: record.WOR_ID,
    WOR_ID_VIEW: record.WOR_ID_VIEW,
    WOO_ID: record.WOO_ID,
    WOR_DT: record.WOR_DT,
    WOO_NAME: record.WOO_NAME,
    WOO_NAME_COLOR: record.WOO_NAME_COLOR,
    WOD_TARGET_REPS: record.WOD_TARGET_REPS,
    WOD_TARGET_SETS: record.WOD_TARGET_SETS,
    WOD_COUNT: record.WOD_COUNT,
    WOD_COUNT_P: record.WOD_COUNT_P,
    WOD_COUNT_S: record.WOD_COUNT_S,
    WOD_POINT: record.WOD_POINT,
    WOR_DESC: record.WOR_DESC ?? ''
  }));
};
// 3.4. 운동 기록 조회 - 그래프에서 사용한다 
async function _getWorkoutRecordsByPivot(mem_id: number, start_dt: string, end_dt: string): Promise<any[]> {
  return select(`
    CALL usp_get_workout_pivot_json(?, ?, ?, @p_result_json);
    SELECT @p_result_json AS RESULT;
  `, [mem_id, start_dt, end_dt]);
}
export const getWorkoutRecordsByPivot = async (mem_id: number, start_dt: string, end_dt: string): Promise<any> => {
  const records = await _getWorkoutRecordsByPivot(mem_id, start_dt, end_dt);
  return records.length > 1 ? records[1][0].RESULT: null;
};
// 3.5. 운동 기록 조회 - 오늘의 운동 운동 스탬프 조회 (최근 7일간의 운동 기록 여부 조회, 오늘의 운동에서 사용) - 날짜 범위 대신 최근 7일간의 기록 여부만 조회하여 간단한 결과 반환 (예: 날짜별로 'G' 또는 'B' 상태 반환)
async function _getWorkoutHistory(P_MEM_ID: string = ''): Promise<any> {
  return select(`
WITH RECURSIVE DATE_RANGE AS (
    SELECT CURDATE() - INTERVAL 7 DAY AS DATE_VAL
    UNION ALL
    SELECT DATE_VAL + INTERVAL 1 DAY
    FROM DATE_RANGE
    WHERE DATE_VAL + INTERVAL 1 DAY <= CURDATE()
)
SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'WO_DT', A.DATE_VAL,
                'STATUS', CASE WHEN B.WOR_DT IS NOT NULL THEN 'G' ELSE 'B' END
            )
        ) AS RESULT
FROM DATE_RANGE A
LEFT JOIN T_WORKOUT_RECORD B
ON B.WOR_DT = A.DATE_VAL
AND B.MEM_ID = ?
`, [P_MEM_ID]);
}
export const getWorkoutHistory = async (P_MEM_ID: string = ''): Promise<any> => {
  const result = await _getWorkoutHistory(P_MEM_ID);
  return result.length > 0 ? result[0].RESULT : null;
}
// 3.6. 최신 운동 기록 ID 조회 - 회원 ID와 날짜로 해당 날짜의 최신 운동 기록 ID 조회 (운동 기록 추가/수정 시, 기존 기록이 있는지 확인용)
async function _getLatestWorkoutId(P_MEM_ID: number, P_WOR_DT: string): Promise<any> {
    return select(`
        SELECT WOR_ID, WOR_ID_VIEW
        FROM  T_WORKOUT_RECORD
        WHERE WOR_ID = (
             SELECT MAX(WOR_ID)
             FROM   T_WORKOUT_RECORD
          WHERE  MEM_ID = ?
          AND    WOR_DT = ?
          AND    WOR_STATUS = 'N'
      )  
    `, [P_MEM_ID, P_WOR_DT]);
}
export const getLatestWorkoutId = async (
    P_MEM_ID: number, 
    P_WOR_DT: string 
): Promise<CurWorkoutRecord> => {
    const records = await _getLatestWorkoutId(P_MEM_ID, P_WOR_DT);
    
    // 결과가 없거나 WOR_ID가 null인 경우 처리
    if (records.length === 0 || records[0].WOR_ID === null) {
        return {} as CurWorkoutRecord; // 빈 객체 반환 (필요에 따라 null로 변경 가능)}; 
    }
    return {
        WOR_ID: records[0].WOR_ID,
        WOR_ID_VIEW: records[0].WOR_ID_VIEW
    };
}
// 3.7. 운동 기록 추가
export const insertWorkoutRecord = async (P_WOR: T_WORKOUT_RECORD): Promise<CurWorkoutRecord> => {
    return await withTransaction(async (conn: PoolConnection) => {
      // 1. 데이터 삽입 (WOR_ID_VIEW는 우선 빈 값으로 입력)
      const [insertResult] = await execute(conn,
          `
          INSERT INTO T_WORKOUT_RECORD (WOR_ID_VIEW, MEM_ID, WOR_DT, WOR_DESC, WOR_STATUS) 
          VALUES (?, ?, ?, ?, ?)
          `,
          [
              '', 
              P_WOR.MEM_ID, 
              P_WOR.WOR_DT, 
              P_WOR.WOR_DESC, 
              "N" // 초기 상태는 'N'으로 설정 (예: 'N' = Not completed, 'C' = Completed)
          ]
      );

      const WOR_ID = (insertResult as any).insertId;
      
      // 2. PREFIX(WOR) + 5자리 숫자 형태로 ID 생성 (예: WOR00005)
      const WOR_ID_VIEW = `WOR${String(WOR_ID).padStart(5, '0')}`;

      // 3. 생성된 가독성 ID로 테이블 업데이트
      await execute(conn,
          `
          UPDATE T_WORKOUT_RECORD 
          SET WOR_ID_VIEW = ? 
          WHERE WOR_ID = ?
          `,
          [WOR_ID_VIEW, WOR_ID]
      );

      // 프라이머리 키(WOR_ID)를 포함하여 결과 리턴
      return { 
          WOR_ID: WOR_ID, 
          WOR_ID_VIEW: WOR_ID_VIEW
      };
    });
};
// 3.8 운동 기록 상세 추가 - 
export const insertWorkoutDetail = async (P_DET: T_WORKOUT_DETAIL): Promise<{ WOR_ID: number, WOO_ID: number }> => {
    return await withTransaction(async (conn) => {
        // 1. 상세 내역 INSERT
        await execute(conn,
            `
            INSERT INTO T_WORKOUT_DETAIL (
                WOR_ID, WOO_ID, WOD_GUIDE, WOD_TARGET_REPS, 
                WOD_TARGET_SETS, WOD_COUNT, WOD_POINT, WOD_ACCURACY, WOD_TIME
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                P_DET.WOR_ID, 
                P_DET.WOO_ID, 
                P_DET.WOD_GUIDE ?? null,
                P_DET.WOD_TARGET_REPS ?? 0,
                P_DET.WOD_TARGET_SETS ?? 0,
                P_DET.WOD_COUNT ?? 0,
                P_DET.WOD_POINT ?? 0,
                P_DET.WOD_ACCURACY ?? 0,
                P_DET.WOD_TIME ?? 0
            ] as any[]
        );

        // 3. 복합 프라이머리 키 리턴
        return { 
            WOR_ID: P_DET.WOR_ID, 
            WOO_ID: P_DET.WOO_ID 
        };
    });
};
// 3.9. 운동 기록 초기화 
// 회원 ID와 날짜로 해당 날짜의 운동 기록이 이미 존재하는지 확인 후, 
// 존재하면 해당 기록의 ID를 반환하고, 존재하지 않으면 새로 생성하여 ID를 반환하는 함수
export const initWorkoutRecord = async (P_MEM_ID: number, P_WOR_DT: string): Promise<CurWorkoutRecord> => {
    return await withTransaction(async (conn) => {
        let WOR_ID = 0; 
        let WOR_ID_VIEW = "";
        let LAST_WOR = await getLatestWorkoutId(P_MEM_ID, P_WOR_DT);
        if (Object.keys(LAST_WOR || {}).length > 0) {
          WOR_ID = LAST_WOR.WOR_ID;
          WOR_ID_VIEW = LAST_WOR.WOR_ID_VIEW;
        }
        else {
          const [Result] = await execute(conn,
              `
INSERT INTO T_WORKOUT_RECORD (WOR_ID_VIEW, MEM_ID, WOR_DT, WOR_DESC) 
VALUES (?, ?, ?, ?)
              `,
              [
                  '', 
                  P_MEM_ID, 
                  P_WOR_DT, 
                  null
              ] as any[]
          );
          // 생성된 AUTO_INCREMENT ID (PK: WOR_ID) 추출
          WOR_ID = (Result as any).insertId;
          // 3. WOR_ID_VIEW 포맷 생성 (PREFIX_ + 5자리 숫자)
          // 지시사항 규칙: WOR + 5자리 패딩 적용 (예: WOR_00001)
          WOR_ID_VIEW = `WOR${String(WOR_ID).padStart(5, '0')}`;
          // 4. 생성된 포맷으로 해당 행 업데이트
          await execute(conn,
              `
UPDATE T_WORKOUT_RECORD SET WOR_ID_VIEW = ? WHERE WOR_ID = ?
              `,
              [WOR_ID_VIEW, WOR_ID] as any[]
          );
          const workouts = await getWorkouts();
          const workoutDetails: T_WORKOUT_DETAIL[] = workouts.slice(0,3).map((record: Workout) => ({
            WOR_ID: WOR_ID,
            WOO_ID: record.WOO_ID,
            WOD_GUIDE: record.WOO_GUIDE,
            WOD_TARGET_REPS: record.WOO_TARGET_REPS,
            WOD_TARGET_SETS: record.WOO_TARGET_SETS,
            WOD_COUNT: 0,
            WOD_POINT: 0,
            WOD_ACCURACY: 0,
            WOD_TIME: 0
          }));
          await Promise.all(
            workoutDetails.map(async (workoutDetail) => {
              await execute(conn, 
                  `
  INSERT INTO T_WORKOUT_DETAIL (
      WOR_ID, WOO_ID, WOD_GUIDE, WOD_TARGET_REPS, 
      WOD_TARGET_SETS, WOD_COUNT, WOD_POINT, WOD_ACCURACY, WOD_TIME
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `,
                  [
                      workoutDetail.WOR_ID, 
                      workoutDetail.WOO_ID, 
                      workoutDetail.WOD_GUIDE ?? null,
                      workoutDetail.WOD_TARGET_REPS,
                      workoutDetail.WOD_TARGET_SETS,
                      workoutDetail.WOD_COUNT,
                      workoutDetail.WOD_POINT,
                      workoutDetail.WOD_ACCURACY,
                      workoutDetail.WOD_TIME
                  ] as any[]
              );
            })
          );          
        }
        // 5. 프라이머리 키(WOR_ID)와 생성된 시각적 ID 리턴
        return { 
            WOR_ID: WOR_ID, 
            WOR_ID_VIEW: WOR_ID_VIEW 
        };
    });
};
// 3.10. 운동 상세 삭제 - 운동 기록 ID로 상세 내역 모두 삭제 (운동 기록 초기화 시, 기존 기록이 있을 경우 삭제용)
export const deleteWorkoutDetails = async (P_WOR_ID: string): Promise<boolean> => {
    return await withTransaction(async (conn) => {
        // 1. 상세 내역 DELETE
        const [Result] = await execute(conn,
            `
            DELETE FROM T_WORKOUT_DETAIL 
            WHERE WOR_ID = ?
            `,
            [
                P_WOR_ID
            ] as any[]
        );

        // 3. 복합 프라이머리 키 리턴
        return Result.affectedRows > 0;
    });
};

// =================================================================================================================
// 4. 운동계획 
// =================================================================================================================
// 4.1. 특정 날짜의 운동 계획 조회 (운동 정보 JOIN)
async function _MemberPlans(P_MEM_ID: number, P_DATE: string): Promise<any[]> {
  return select(`
    SELECT  A.MEP_ID,
            A.MEM_ID,
            A.WOO_ID,
            B.WOO_NAME,
            B.WOO_IMG,
            A.MEP_TARGET,
            A.MEP_UNIT,
            A.MEP_ACHIEVED
    FROM    T_MEMBER_PLAN A
    JOIN    T_WORKOUT B ON B.WOO_ID = A.WOO_ID
    WHERE   A.MEM_ID = ? 
      AND   A.MEP_DATE = ?
    ORDER BY A.MEP_ID ASC
  `, [P_MEM_ID, P_DATE]);
}
export const MemberPlans = async (P_MEM_ID: number, P_DATE: string): Promise<any[]> => {
  const records = await _MemberPlans(P_MEM_ID, P_DATE);
  return records.map((record: any) => ({
    MEP_ID: record.MEP_ID,
    MEM_ID: record.MEM_ID,
    WOO_ID: record.WOO_ID,
    WOO_NAME: record.WOO_NAME,
    WOO_IMG: record.WOO_IMG,
    MEP_TARGET: record.MEP_TARGET,
    MEP_UNIT: record.MEP_UNIT,
    MEP_ACHIEVED: record.MEP_ACHIEVED
  }));
}
// 4.2. 새로운 운동 계획 추가
export const addMemberPlan = async (plan: {
  MEM_ID: number;
  WOO_ID: string;
  MEP_DATE: string;
  MEP_TARGET: number;
  MEP_UNIT: string;
}): Promise<void> => {
  await withTransaction(async (conn) => {
    const [result] = await execute(conn,
        `
      INSERT INTO T_MEMBER_PLAN (MEM_ID, WOO_ID, MEP_DATE, MEP_TARGET, MEP_UNIT)
      VALUES (?, ?, ?, ?, ?)
        `,
        [
            plan.MEM_ID,
            plan.WOO_ID,
            plan.MEP_DATE,
            plan.MEP_TARGET,
            plan.MEP_UNIT
        ] as any[]
    );        // 3. 복합 프라이머리 키 리턴
  });
}
// 4.3. 운동 계획 삭제
export const deleteMemberPlan = async (P_MEP_ID: number): Promise<void> => {
  await withTransaction(async (conn) => {
      const [result] = await execute(conn,
        `
      DELETE FROM T_MEMBER_PLAN WHERE MEP_ID = ?
        `,
        [
           P_MEP_ID
        ] as any[]
    );        
  });
}
// 4.4. 월간 운동 요약 정보 조회
export const getMonthStatus = async (P_MEM_ID: number, P_MONTH: string): Promise<any[]> => {
  return select(`
    SELECT 
      MEP_DATE,
      COUNT(*) as TOTAL_COUNT,
      SUM(CASE WHEN MEP_ACHIEVED = 'Y' THEN 1 ELSE 0 END) as DONE_COUNT
    FROM T_MEMBER_PLAN
    WHERE MEM_ID = ? AND MEP_DATE LIKE ?
    GROUP BY MEP_DATE
  `, [P_MEM_ID, `${P_MONTH}%`]); 
}
// =================================================================================================================
// 5. 쇼핑몰 
// =================================================================================================================
async function _getGoods(): Promise<any[]> {
  return select(`
SELECT  GOD_ID,
        GOD_ID_VIEW,
        GOD_NAME,
        GOD_PRICE,
        GOD_DCRATE,
        GOD_IMG
FROM T_GOODS
`);
}
export const getGoods = async (): Promise<Goods[]> => {
  const records = await _getGoods();
  return records.map((record: any) => ({
    GOD_ID: record.GOD_ID,
    GOD_ID_VIEW: record.GOD_ID_VIEW,
    GOD_NAME: record.GOD_NAME,
    GOD_PRICE: record.GOD_PRICE,
    GOD_DCRATE: record.GOD_DCRATE,
    GOD_IMG: record.GOD_IMG
  }));
};

