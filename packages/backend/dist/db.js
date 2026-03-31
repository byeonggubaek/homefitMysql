import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import Logger from './logger.js';
// 환경 변수 로드
dotenv.config();
let pool = null;
let poolPromise = null;
// =================================================================================================================
// DB 커넥션 풀 관리 및 원시 쿼리 실행 함수들
// =================================================================================================================
// 1. 커넥션 풀 생성
export async function initPool() {
    if (pool)
        return;
    if (!poolPromise) {
        poolPromise = (async () => {
            try {
                const p = await mysql.createPool({
                    host: process.env.MYSQL_HOST,
                    user: process.env.MYSQL_USER,
                    password: process.env.MYSQL_PASSWORD,
                    database: process.env.MYSQL_DATABASE,
                    port: Number(process.env.MYSQL_PORT) || 3306,
                    waitForConnections: true,
                    multipleStatements: true,
                    connectionLimit: 10,
                    queueLimit: 0,
                });
                console.log('DB 풀 생성 완료');
                await Logger.log('i', 'DB 풀 생성 성공');
                return p;
            }
            catch (error) {
                console.error('DB 풀 생성 실패:', error);
                await Logger.logError('DB 풀 생성 실패', error);
                throw error;
            }
        })();
    }
    pool = await poolPromise;
}
// 2. 커넥션 풀 종료
export async function closePool() {
    if (!pool)
        return;
    try {
        await pool.end(); // MySQL 풀 종료
        console.log('DB풀을 종료하였습니다.');
        await Logger.log('i', 'DB풀 종료 성공');
    }
    catch (error) {
        console.log('DB풀을 종료하지 못했습니다.', error.message || error);
        await Logger.logError('DB풀 종료 실패', error.message || error);
        throw error;
    }
}
// 3. 원시 쿼리 실행 - SELECT (결과 반환)
export async function select(sql, binds = []) {
    let logEntry = null;
    try {
        await initPool();
        logEntry = await Logger.logQueryStart(sql, binds);
        const [rows] = await pool.query(sql, binds);
        await Logger.logQuerySuccess(logEntry, rows.length || 0);
        return rows;
    }
    catch (error) {
        await Logger.logQueryError(logEntry, error.message || error);
        throw error;
    }
}
// 3. 원시 쿼리 실행 - SELECT (결과 반환)
export async function execute(conn, sql, binds = []) {
    let logEntry = null;
    try {
        await initPool();
        logEntry = await Logger.logQueryStart(sql, binds);
        const result = await conn.execute(sql, binds);
        await Logger.logQuerySuccess(logEntry, result.affectedRows || 0);
        return result;
    }
    catch (error) {
        await Logger.logQueryError(logEntry, error.message || error);
        throw error;
    }
}
// 4. 원시 쿼리 실행 - DML (INSERT/UPDATE/DELETE)
export async function withTransaction(handler) {
    let conn = null;
    try {
        if (!pool) {
            throw new Error('DB 풀이 초기화되지 않았습니다.');
        }
        conn = await pool.getConnection();
        await conn.beginTransaction();
        const result = await handler(conn);
        await conn.commit();
        return result;
    }
    catch (err) {
        if (conn) {
            await conn.rollback();
        }
        throw err;
    }
    finally {
        if (conn) {
            conn.release();
        }
    }
}
// =================================================================================================================
// DB에서 읽어들인 데이터를 객체 데이터로 변환하여 반환하는 함수들
// =================================================================================================================
// 1. 메뉴 조회 - 메뉴와 서브메뉴를 각각 조회한 후, 자바스크립트에서 조합하여 반환
async function _getSubMenus(P_NAV_ID = '') {
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
export const getSubMenus = async (P_NAV_ID = '') => {
    const records = await _getSubMenus(P_NAV_ID);
    // 1단계: 메뉴 객체 생성
    return records.map((record) => ({
        NAS_ID: record.NAS_ID,
        NAS_NAME: record.NAS_NAME || '',
        NAS_HREF: record.NAS_HREF || '',
        NAS_DESC: record.NAS_DESC || ''
    }));
};
async function _getMenus() {
    return select(`
SELECT  NAV_ID, 
        NAV_NAME, 
        NAV_IMG, 
        NAV_DESC 
FROM    T_NAV_ITEM
`);
}
export const getMenus = async () => {
    const records = await _getMenus();
    // 1단계: NavItem[]로 변환 (map 사용!)
    let menus = records.map((record) => ({
        NAV_ID: record.NAV_ID,
        NAV_NAME: record.NAV_NAME || '',
        NAV_IMG: record.NAV_IMG || '',
        NAV_DESC: record.NAV_DESC || '',
        NAV_SUB_MENUS: [] // 빈 배열 초기화
    }));
    // 2단계: 병렬로 모든 서브메뉴 로드
    await Promise.all(menus.map(async (menu) => {
        menu.NAV_SUB_MENUS = await getSubMenus(menu.NAV_ID);
    }));
    return menus;
};
async function _getMenuPos(P_NAS_PAGE = '') {
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
export const getMenuPos = async (P_NAS_PAGE = '') => {
    const result = await _getMenuPos(P_NAS_PAGE);
    return result.length > 0 ? result[0].RESULT : null;
};
async function _searchMenus(key = '') {
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
export const searchMenus = async (key = '') => {
    const records = await _searchMenus(key);
    return records.map((record) => ({
        NAS_ID: record.NAS_ID,
        NAS_NAME: record.NAS_NAME,
        NAS_HREF: record.NAS_HREF,
        NAS_DESC: record.NAS_DESC
    }));
};
async function _getMember(P_MEM_ID) {
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
export const getMember = async (P_MEM_ID) => {
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
            MES_ID: records[0].MES_ID,
            MES_NAME: records[0].MES_NAME,
            MES_FEE: records[0].MES_FEE
        }];
};
export const insertMember = async (P_MEM) => {
    return await withTransaction(async (conn) => {
        // 1. 회원 정보 최초 INSERT (MEM_ID_VIEW는 임시 빈 값)
        const [insertResult] = await conn.execute(`INSERT INTO T_MEMBER (
                MEM_ID_VIEW, MEM_NAME, MEM_NICKNAME, MEM_PASSWORD, 
                MEM_IMG, MEM_PNUMBER, MEM_EMAIL, MEM_SEX, 
                MEM_AGE, MEM_POINT, MEM_EXP_POINT, MEM_LVL, MES_ID
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            P_MEM.MEM_ID_VIEW,
            P_MEM.MEM_NAME,
            P_MEM.MEM_NICKNAME ?? null,
            P_MEM.MEM_PASSWORD,
            P_MEM.MEM_IMG ?? null,
            P_MEM.MEM_PNUMBER ?? null,
            P_MEM.MEM_EMAIL ?? null,
            P_MEM.MEM_SEX,
            P_MEM.MEM_AGE,
            P_MEM.MEM_POINT,
            P_MEM.MEM_EXP_POINT,
            P_MEM.MEM_LVL,
            P_MEM.MES_ID
        ] // ExecuteValues 타입 에러 방지용 캐스팅
        );
        // 생성된 AUTO_INCREMENT ID (PK) 추출
        const newId = insertResult.insertId;
        // 4. 프라이머리 키(MEM_ID)와 생성된 시각적 ID 리턴
        return {
            MEM_ID: newId,
            MEM_ID_VIEW: P_MEM.MEM_ID_VIEW
        };
    });
};
async function _getWorkoutHistory(P_MEM_ID = '') {
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
export const getWorkoutHistory = async (P_MEM_ID = '') => {
    const result = await _getWorkoutHistory(P_MEM_ID);
    return result.length > 0 ? result[0].RESULT : null;
};
async function _getWorkoutDetails(P_WOR_ID) {
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
export const getWorkoutDetails = async (P_WOR_ID) => {
    const records = await _getWorkoutDetails(P_WOR_ID);
    return records.map((record) => ({
        WOO_ID: record.WOO_ID,
        WOO_NAME: record.WOO_NAME,
        WOO_IMG: record.WOO_IMG,
        WOO_UNIT: record.WOO_UNIT,
        WOD_GUIDE: record.WOD_GUIDE,
        WOD_TARGET_REPS: record.WOD_TARGET_REPS,
        WOD_TARGET_SETS: record.WOD_TARGET_SETS
    }));
};
async function _getWorkouts() {
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
export const getWorkouts = async () => {
    const records = await _getWorkouts();
    return records.map((record) => ({
        WOO_ID: record.WOO_ID,
        WOO_NAME: record.WOO_NAME,
        WOO_GUIDE: record.WOO_GUIDE,
        WOO_IMG: record.WOO_IMG,
        WOO_UNIT: record.WOO_UNIT,
        WOO_TARGET_REPS: record.WOO_TARGET_REPS,
        WOO_TARGET_SETS: record.WOO_TARGET_SETS
    }));
};
async function _isMember(P_MEM_ID_VIEW) {
    const result = await select(`
SELECT  MEM_ID_VIEW
FROM    T_MEMBER A
WHERE   MEM_ID_VIEW = ?
`, [P_MEM_ID_VIEW]);
    return result.length > 0;
}
async function _checkMember(P_MEM_ID_VIEW, P_MEM_PASSWORD) {
    const records = await select(`
  CALL member_login(?, ?)
`, [P_MEM_ID_VIEW, P_MEM_PASSWORD]);
    return records[0].length === 0 ? [] :
        records[0].map((record) => ({
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
            MES_ID: record.MES_ID,
            MES_NAME: record.MES_NAME,
            MES_FEE: record.MES_FEE
        }));
}
export const login = async (P_MEM_ID_VIEW, P_MEM_PASSWORD) => {
    const bool = await _isMember(P_MEM_ID_VIEW);
    if (!bool) {
        return {
            STATUS: "FAIL",
            ERROR: '회원정보가 존재하지 않습니다.'
        };
    }
    const records = await _checkMember(P_MEM_ID_VIEW, P_MEM_PASSWORD);
    if (!records || records.length === 0) {
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
};
async function _getBenefits(P_MES_ID = '') {
    return select(`
 SELECT B.BEN_ID, 
        B.BEN_NAME
  FROM  T_MEMBERSHIP_BENEFIT A
  JOIN  T_BENEFIT B
    ON  B.BEN_ID = A.BEN_ID
 WHERE  A.MES_ID = ?
`, [P_MES_ID]);
}
export const getBenefits = async (P_MES_ID = '') => {
    const records = await _getBenefits(P_MES_ID);
    // 1단계: 메뉴 객체 생성
    return records.map((record) => ({
        BEN_ID: record.BEN_ID,
        BEN_NAME: record.BEN_NAME || ''
    }));
};
async function _getMemberships() {
    return select(`
  SELECT  MES_ID,
          MES_NAME,
          MES_FEE
  FROM    T_MEMBERSHIP
  WHERE   MES_ID <> 'MES00001'
`);
}
export const getMemberships = async () => {
    const records = await _getMemberships();
    let memberships = records.map((record) => ({
        MES_ID: record.MES_ID,
        MES_NAME: record.MES_NAME || '',
        MES_FEE: record.MES_FEE || 0,
        MES_BENEFITS: []
    }));
    // 2단계: 병렬로 모든 서브메뉴 로드
    await Promise.all(memberships.map(async (membership) => {
        membership.MES_BENEFITS = await getBenefits(membership.MES_ID);
    }));
    return memberships;
};
async function _getScript(tableName) {
    try {
        // 테이블이 없으면 여기서 에러가 발생하므로 try-catch로 감쌉니다.
        return await select(`SHOW CREATE TABLE ${tableName}`);
    }
    catch (error) {
        // 테이블이 없는 경우 콘솔에 로그만 남기고 null을 반환하여 스킵 준비를 합니다.
        console.warn(`Table not found: ${tableName}`);
        return null;
    }
}
export const getScripts = async (tableNames) => {
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
async function _getRanking(from_dt = '', to_dt = '') {
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
export const getRanking = async (from_dt = '', to_dt = '') => {
    const subMenus = await _getRanking(from_dt, to_dt);
    return subMenus.map((sub) => ({
        RANK: sub.RANK,
        MEM_ID: sub.MEM_ID,
        MEM_NAME: sub.MEM_NAME,
        MEM_IMG: sub.MEM_IMG,
        CNT: sub.CNT,
        WORKOUT_TIME: sub.WORKOUT_TIME
    }));
};
async function _getLatestWorkoutId(P_MEM_ID, P_WOR_DT) {
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
export const getLatestWorkoutId = async (P_MEM_ID, P_WOR_DT) => {
    const records = await _getLatestWorkoutId(P_MEM_ID, P_WOR_DT);
    // 결과가 없거나 WOR_ID가 null인 경우 처리
    if (records.length === 0 || records[0].WOR_ID === null) {
        return {}; // 빈 객체 반환 (필요에 따라 null로 변경 가능)}; 
    }
    return {
        WOR_ID: records[0].WOR_ID,
        WOR_ID_VIEW: records[0].WOR_ID_VIEW
    };
};
export const insertWorkoutRecord = async (P_WOR) => {
    return await withTransaction(async (conn) => {
        // 1. 데이터 삽입 (WOR_ID_VIEW는 우선 빈 값으로 입력)
        const [insertResult] = await execute(conn, `
            INSERT INTO T_WORKOUT_RECORD (WOR_ID_VIEW, MEM_ID, WOR_DT, WOR_DESC, WOR_STATUS) 
            VALUES (?, ?, ?, ?, ?)
            `, [
            '',
            P_WOR.MEM_ID,
            P_WOR.WOR_DT,
            P_WOR.WOR_DESC,
            "N" // 초기 상태는 'N'으로 설정 (예: 'N' = Not completed, 'C' = Completed)
        ]);
        const WOR_ID = insertResult.insertId;
        // 2. PREFIX(WOR) + 5자리 숫자 형태로 ID 생성 (예: WOR00005)
        const WOR_ID_VIEW = `WOR${String(WOR_ID).padStart(5, '0')}`;
        // 3. 생성된 가독성 ID로 테이블 업데이트
        await execute(conn, `
            UPDATE T_WORKOUT_RECORD 
            SET WOR_ID_VIEW = ? 
            WHERE WOR_ID = ?
            `, [WOR_ID_VIEW, WOR_ID]);
        // 프라이머리 키(WOR_ID)를 포함하여 결과 리턴
        return {
            WOR_ID: WOR_ID,
            WOR_ID_VIEW: WOR_ID_VIEW
        };
    });
};
export const insertWorkoutDetail = async (P_DET) => {
    return await withTransaction(async (conn) => {
        // 1. 상세 내역 INSERT
        await execute(conn, `INSERT INTO T_WORKOUT_DETAIL (
                WOR_ID, WOO_ID, WOD_GUIDE, WOD_TARGET_REPS, 
                WOD_TARGET_SETS, WOD_COUNT, WOD_POINT, WOD_ACCURACY, WOD_TIME
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            P_DET.WOR_ID,
            P_DET.WOO_ID,
            P_DET.WOD_GUIDE ?? null,
            P_DET.WOD_TARGET_REPS,
            P_DET.WOD_TARGET_SETS,
            P_DET.WOD_COUNT,
            P_DET.WOD_POINT,
            P_DET.WOD_ACCURACY,
            P_DET.WOD_TIME
        ]);
        // 3. 복합 프라이머리 키 리턴
        return {
            WOR_ID: P_DET.WOR_ID,
            WOO_ID: P_DET.WOO_ID
        };
    });
};
export const initWorkoutRecord = async (P_MEM_ID, P_WOR_DT) => {
    return await withTransaction(async (conn) => {
        let WOR_ID = 0;
        let WOR_ID_VIEW = "";
        let LAST_WOR = await getLatestWorkoutId(P_MEM_ID, P_WOR_DT);
        if (Object.keys(LAST_WOR || {}).length > 0) {
            WOR_ID = LAST_WOR.WOR_ID;
            WOR_ID_VIEW = LAST_WOR.WOR_ID_VIEW;
        }
        else {
            const [insertResult] = await execute(conn, `
INSERT INTO T_WORKOUT_RECORD (WOR_ID_VIEW, MEM_ID, WOR_DT, WOR_DESC) 
VALUES (?, ?, ?, ?)
              `, [
                '',
                P_MEM_ID,
                P_WOR_DT,
                null
            ]);
            // 생성된 AUTO_INCREMENT ID (PK: WOR_ID) 추출
            WOR_ID = insertResult.insertId;
            // 3. WOR_ID_VIEW 포맷 생성 (PREFIX_ + 5자리 숫자)
            // 지시사항 규칙: WOR + 5자리 패딩 적용 (예: WOR_00001)
            WOR_ID_VIEW = `WOR${String(WOR_ID).padStart(5, '0')}`;
            // 4. 생성된 포맷으로 해당 행 업데이트
            await execute(conn, `
UPDATE T_WORKOUT_RECORD SET WOR_ID_VIEW = ? WHERE WOR_ID = ?
              `, [WOR_ID_VIEW, WOR_ID]);
            const workouts = await getWorkouts();
            const workoutDetails = workouts.slice(0, 3).map((record) => ({
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
            await Promise.all(workoutDetails.map(async (workoutDetail) => {
                await execute(conn, `
  INSERT INTO T_WORKOUT_DETAIL (
      WOR_ID, WOO_ID, WOD_GUIDE, WOD_TARGET_REPS, 
      WOD_TARGET_SETS, WOD_COUNT, WOD_POINT, WOD_ACCURACY, WOD_TIME
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `, [
                    workoutDetail.WOR_ID,
                    workoutDetail.WOO_ID,
                    workoutDetail.WOD_GUIDE ?? null,
                    workoutDetail.WOD_TARGET_REPS,
                    workoutDetail.WOD_TARGET_SETS,
                    workoutDetail.WOD_COUNT,
                    workoutDetail.WOD_POINT,
                    workoutDetail.WOD_ACCURACY,
                    workoutDetail.WOD_TIME
                ]);
            }));
        }
        // 5. 프라이머리 키(WOR_ID)와 생성된 시각적 ID 리턴
        return {
            WOR_ID: WOR_ID,
            WOR_ID_VIEW: WOR_ID_VIEW
        };
    });
};
// =================================================================================================================
// 오라클 버전 
// =================================================================================================================
// 2. 칼럼정의 조회 - 테이블명으로 칼럼정의 조회 (칼럼명은 소문자로 반환)
async function _getColDescs(tableName) {
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
async function _getWorkoutRecords(memberId, from, to) {
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
async function _getWorkoutPivot(memberId, from, to) {
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
async function _getWorkoutPivotWithPlan(memberId, from, to) {
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
// =================================================================================================================
// DB에서 읽어들인 데이터를 객체 데이터로 변환하여 반환하는 함수들
// =================================================================================================================
// 2. 메뉴 조회 
// 3. 메뉴 검색
// 4. 메뉴 검색
// 4. Column Description 조회
export const getColDescs = async (tableName) => {
    const colDescs = await _getColDescs(tableName);
    return colDescs.map((col) => ({
        id: col.ID,
        title: col.TITLE,
        type: col.TYPE,
        width: col.WIDTH,
        summary: col.SUMMARY,
        aggregate: 0
    }));
};
// 5. 운동내역 조회
export const getWorkoutRecords = async (memberId, from, to) => {
    const records = await _getWorkoutRecords(memberId, from, to);
    return records.map((rec) => ({
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
};
// 6. 운동내역 피벗 조회
export const getWorkoutPivot = async (memberId, from, to) => {
    const result = await _getWorkoutPivot(memberId, from, to);
    // 3. ChartData 타입 반환
    return {
        columns: result.columns,
        data: result.data
    };
};
// 7. 운동내역 피벗 조회 (플랜 포함)
export const getWorkoutPivotWithPlan = async (memberId, from, to) => {
    const result = await getRawWorkoutPivotWithPlan(memberId, from, to);
    // 3. ChartData 타입 반환
    return {
        columns: result.columns,
        data: result.data
    };
};
// 8. 운동내역 히스토리 조회
// 9. 운동내역 상세 조회
// 10. 회원정보 조회
// 12. 회원정보 검증
