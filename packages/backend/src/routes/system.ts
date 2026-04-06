import express from 'express';
import { Request, Response } from 'express';
import Logger from '../logger.js'
import { getScripts } from '../db.js';

const systemRouter = express.Router();

systemRouter.post("/getSelectPrompt", async (req: Request, res: Response) => {
  let apiLogEntry = null;
  try {
    const { method, eventHandler, sql } = req.body;
    // 1. 유효성 검사 (401보다는 400 Bad Request가 더 적절합니다)
    if (!method || !eventHandler || !sql) {
      return res.status(400).json({
        success: false,
        error: '필수 입력값이 누락되었습니다 (method, eventHandler, sql).'
      });
    }
    apiLogEntry = await Logger.logApiStart('POST /api/system/getSelectPrompt', [method, eventHandler, sql]);
    // 2. 테이블 추출 및 중복 제거
    const tableRegex = /(?:FROM|JOIN)\s+([A-Z0-9_]+)/gi;
    let match;
    const tableSet = new Set<string>(); // Set으로 중복 자동 제거

    while ((match = tableRegex.exec(sql)) !== null) {
      const tableName = match[1].toUpperCase();
      tableSet.add(tableName);
    }
    const tables = Array.from(tableSet);
    const scripts = await getScripts(tables);
    if(scripts.length == 0) {
      await Logger.logApiError(apiLogEntry, '스크립트 조회 실패');
      return res.status(401).json({
        success: false,
        error: '스크립트 조회 실패'
      });
    }
    else {
      let prompt = "";

      // Get방식
      if (method === "G") {
        prompt = `
  [이벤트 핸들러]
  ${eventHandler}
  [테이블 구조]
  ${scripts.toString()}
  [쿼리]
  ${sql}
  [지시사항]
  테이블 구조와 쿼리를 분석해서 SELECT 문의 컬럼에 대응되는 type를 선언하고  DB에서 조회해서 
  Frontend로 보내는 Backend express 이벤트 핸들러를 만들어 줘
  이때, 입력 쿼리가 2개 이상이고 부모 자식의 관계이면 부모 타입에 자식 타입을 포함시키는 형태로 만들어 주고 그렇지 않으면 각각 독립된 타입으로 만들어 줘
  결과가 하나만 리턴될거 같은면 return type은 배열이 아니라 객체로 만들어 줘
  [예제]
  export interface Membership {
      MES_ID : string;
      MES_NAME: string;
      MES_FEE: number;
  }
  app.get('/getMembership', async (req: Request, res: Response) => {
    let apiLogEntry = null;
    try {
      const { mes_id } = req.query as { mes_id: string };
      if (!mes_id) {
        return res.status(400).json({
          success: false,
          error: '멥버쉽 ID가 필요합니다.'
        });
      }
      apiLogEntry = await Logger.logApiStart('GET /api/member/getMember', [mes_id]);
      const data = await getMembership(mes_id);
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

  async function _getMembership(P_MES_ID: string): Promise<any> {
    return select(\`
  SELECT A.MES_ID,
        A.MES_NAME,
        A.MES_FEE
  FROM T_MEMBERSHIP B 
  WHERE B.MES_ID = ?
  \`, [P_MES_ID]);
  }
  export const getMembership = async (P_MES_ID: string): Promise<Membership[]> => {
    const records = await _getMembership(P_MES_ID);
    return records.length === 0 ? [] : [{
      MES_ID: records[0].MES_ID,
      MES_NAME: records[0].MES_NAME,
      MES_FEE: records[0].MES_FEE
    }];
  }
  `;
      }
      // Post방식
      else{
        prompt = ` 
  [이벤트 핸들러]
  ${eventHandler}
  [테이블 구조]
  ${scripts.toString()}
  [쿼리]
  ${sql}
  [지시사항]
  테이블 구조와 쿼리를 분석해서 SELECT 문의 컬럼에 대응되는 type를 선언하고  DB에서 조회해서 
  Frontend로 보내는 Backend express 이벤트 핸들러를 만들어 줘
  이때, 입력 쿼리가 2개 이상이고 부모 자식의 관계이면 부모 타입에 자식 타입을 포함시키는 형태로 만들어 주고 그렇지 않으면 각각 독립된 타입으로 만들어 줘
  결과가 하나만 리턴될거 같은면 return type은 배열이 아니라 객체로 만들어 줘
  [예제]
  export interface Membership {
      MES_ID : string;
      MES_NAME: string;
      MES_FEE: number;
  }
  app.post('/getMembership', async (req: Request, res: Response) => {
    let apiLogEntry = null;
    try {
      const { mes_id } = req.body; 
      if (!mes_id) {
        return res.status(400).json({
          success: false,
          error: '멥버쉽 ID가 필요합니다.'
        });
      }
      apiLogEntry = await Logger.logApiStart('POST /api/getMembership', [mes_id]);
      const data = await getMembership(mes_id);
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

  async function _getMembership(P_MES_ID: string): Promise<any> {
    return select(\`
  SELECT 	A.MES_ID, 
          A.MES_NAME,
          A.MES_FEE
  FROM	T_MEMBERSHIP A
  WHERE	A.MES_ID = ?
  \`, [P_MES_ID]);
  }
  export const getMembership = async (P_MES_ID: string): Promise<Membership[]> => {
    const records = await _getMembership(P_MES_ID);
    return records.length === 0 ? [] : [{
      MES_ID: records[0].MES_ID,
      MES_NAME: records[0].MES_NAME,
      MES_FEE: records[0].MES_FEE
    }];
  }`;
      }
      // console.log('Generated backend prompt:', prompt);
      res.json({
        success: true,
        data: prompt,
        timestamp: new Date().toISOString()
      });      
      await Logger.logApiSuccess(apiLogEntry);
    }
  } catch (error) {
    console.log('Error during backend prompt generation:', (error as Error).message || error);
    await Logger.logApiError(apiLogEntry, error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});
systemRouter.post("/getInsertPrompt", async (req: Request, res: Response) => {
  let apiLogEntry = null;
  try {
    const { eventHandler, table } = req.body;
    // 1. 유효성 검사 (401보다는 400 Bad Request가 더 적절합니다)
    if (!eventHandler || !table) {
      return res.status(400).json({
        success: false,
        error: '필수 입력값이 누락되었습니다 (eventHandler, table).'
      });
    }
    apiLogEntry = await Logger.logApiStart('POST /api/system/getInsertPrompt', [eventHandler, table]);
    // 2. 테이블 추출 및 중복 제거
    const tableRegex = /([^\s,]+)/gi;
    let match;
    const tableSet = new Set<string>(); // Set으로 중복 자동 제거

    while ((match = tableRegex.exec(table)) !== null) {
        // 1. match[1]로 추출된 단어를 가져옴
        // 2. toUpperCase()로 대소문자 구분 없이 동일하게 처리 (중복 제거의 핵심)
        const tableName = match[1].toUpperCase();
        
        // 3. Set에 추가 (이미 존재하면 자동으로 무시됨)
        tableSet.add(tableName);
    }
    const tables = Array.from(tableSet);
    const scripts = await getScripts(tables);
    if(scripts.length == 0) {
      await Logger.logApiError(apiLogEntry, '스크립트 조회 실패');
      return res.status(401).json({
        success: false,
        error: '스크립트 조회 실패'
      });
    }
    else {
      let prompt = ` 
[이벤트 핸들러]
${eventHandler}
[테이블 구조]
${scripts.toString()}
[지시사항]
입력된 테이블들의 칼럼에 대응되는 tyype을 선언하고  DB에 반영하는 Backend express 이벤트 핸들러를 만들어 줘
AUTO_INCREMENT 되는 값은 파라미터로 넘어오지 않고 자동채번한 후 
예제와 같이 AUTO가 빠진 칼럼에 PREFIX + 5자리 숫자 형태로 만들어서 업데이트 해주는 형태로 만들어 줘
날자는 입력값이 넘어오지 않으면 현재 날짜로 입력되도록 만들어 줘
프라이머리 키를 리턴해줘 
이때, withTransaction 함수로 감싸서 트랜잭션이 적용된 형태로 만들어 줘
import문은 다 제외해줘
[트랙잭션]
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
[예제]
export interface T_ACHIEVEMENT {
    ACH_ID?: number;   // AUTO_INCREMENT로 생성되는 내부 ID
    ACH_ID_VIEW: string;    // 업적 ID (예: ACH_00001)
    ACH_NAME: string;       // 업적 명
    ACH_IMG?: string | null; // 업적 이미지 경로
    ACH_DESC?: string | null; // 업적 설명
}

app.post('/insertAchievement', async (req: Request, res: Response) => {
    let apiLogEntry = null;
    try {
        const { ach_id_view,ach_name, ach_img, ach_desc } = req.body;

        // 필수값 검증
        if (!ach_name) {
            return res.status(400).json({
                success: false,
                error: '업적 ID(ach_id_view)이 필요합니다.'
            });
        }

        apiLogEntry = await Logger.logApiStart('POST /api/insertAchievement', [ach_id_view,ach_name, ach_img, ach_desc]);

        const achievementData: T_ACHIEVEMENT = {
            ACH_ID: '', // 서비스 내부에서 생성 예정
            ACH_ID_VIEW: ach_id_view,
            ACH_NAME: ach_name,
            ACH_IMG: ach_img || null,
            ACH_DESC: ach_desc || null
        };

        const result = await insertAchievement(achievementData);

        res.json({
            success: true,
            data: result, // { ACH_ID, ACH_ID_VIEW } 리턴
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

export const insertAchievement = async (P_ACH: T_ACHIEVEMENT): Promise<{ ACH_ID: number, ACH_ID_VIEW: string }> => {
    return await withTransaction(async (conn: PoolConnection) => {
        const [Result] = await execute(conn,
            \`
INSERT INTO T_ACHIEVEMENT (ACH_ID_VIEW, ACH_NAME, ACH_IMG, ACH_DESC) 
VALUES (?, ?, ?, ?)
            \`,
            [
              '', 
              P_ACH.ACH_NAME, 
              P_ACH.ACH_IMG ?? null, 
              P_ACH.ACH_DESC ?? null
            ] 
        );

        const newAutoId = (Result as any).insertId;
        const formattedId = \`ACH\${String(newAutoId).padStart(5, '0')}\`;

        await execute(conn,
            \`
            UPDATE T_ACHIEVEMENT 
            SET ACH_ID_VIEW = ? 
            WHERE ACH_ID = ?
            \`,
            [formattedId, newAutoId]
        );

        return { 
            ACH_ID: newAutoId, 
            ACH_ID_VIEW: formattedId 
        };
    });
};
    `;
      res.json({
        success: true,
        data: prompt,
        timestamp: new Date().toISOString()
      });      
      await Logger.logApiSuccess(apiLogEntry);
    }
  } catch (error) {
    console.log('Error during backend prompt generation:', (error as Error).message || error);
    await Logger.logApiError(apiLogEntry, error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});
systemRouter.post("/getUpdatePrompt", async (req: Request, res: Response) => {
  let apiLogEntry = null;
  try {
    const { eventHandler, sql } = req.body;
    // 1. 유효성 검사 (401보다는 400 Bad Request가 더 적절합니다)
    if (!eventHandler || !sql) {
      return res.status(400).json({
        success: false,
        error: '필수 입력값이 누락되었습니다 (eventHandler, sql).'
      });
    }
    apiLogEntry = await Logger.logApiStart('POST /api/system/getUpdatePrompt', [eventHandler, sql]);
    let prompt = ` 
[이벤트 핸들러]
${eventHandler}
[쿼리]
${sql}
[지시사항]
쿼리들은 ;으로 구분되어 있고 각각 UPDATE, INSERT, DELETE문이야
쿼리들을 분석해서 DB에 반영하는 Backend express 이벤트 핸들러를 만들어 줘
이때, withTransaction 함수로 감싸서 트랜잭션이 적용된 형태로 만들어 줘
import문은 다 제외해줘
[트랙잭션]
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
[예제]
app.post('/updateAchievement', async (req: Request, res: Response) => {
    let apiLogEntry = null;
    try {
        const { ach_id, ach_name, ach_id2, ach_name2 } = req.body;

        // 필수값 검증
        if (!ach_name) {
            return res.status(400).json({
                success: false,
                error: '업적 이름(ach_name)이 필요합니다.'
            });
        }

        apiLogEntry = await Logger.logApiStart('POST /api/updateAchievement', [ach_id, ach_name, ach_id2, ach_name2]);

        const result = await updateAchievement({ ACH_ID: ach_id, ACH_NAME: ach_name, ACH_ID2: ach_id2, ACH_NAME2: ach_name2 });

        res.json({
            success: true,
            data: result, // { ACH_AUTO_ID, ACH_ID } 리턴
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

export const updateAchievement = async (ACH_ID: number, ACH_NAME: string, ACH_ID2: number, ACH_NAME2: string): Promise<Boolean> => {
    return await withTransaction(async (conn: PoolConnection) => {
      await execute(conn,
            \`
UPDATE	T_MEMBER 
SET		MEM_POINT = ?
WHERE	MEM_ID = ?;

UPDATE	T_MEMBER 
SET		MEM_POINT = ?
WHERE	MEM_ID = ?
            \`,
            [formattedId, newAutoId]
        );

        return { 
            ACH_AUTO_ID: newAutoId, 
            ACH_ID: formattedId 
        };
    });
};
    `;
      res.json({
        success: true,
        data: prompt,
        timestamp: new Date().toISOString()
      });      
      await Logger.logApiSuccess(apiLogEntry);
  } catch (error) {
    console.log('Error during backend prompt generation:', (error as Error).message || error);
    await Logger.logApiError(apiLogEntry, error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});
systemRouter.post("/getGraphPrompt", async (req: Request, res: Response) => {
  let apiLogEntry = null;
  try {
    const { eventHandler, sql } = req.body;
    // 1. 유효성 검사 (401보다는 400 Bad Request가 더 적절합니다)
    if (!eventHandler || !sql) {
      return res.status(400).json({
        success: false,
        error: '필수 입력값이 누락되었습니다 (eventHandler, sql).'
      });
    }
    apiLogEntry = await Logger.logApiStart('POST /api/system/getGraphPrompt', [eventHandler, sql]);

    let prompt = `
  [이벤트 핸들러]
  ${eventHandler}
  [쿼리]
  ${sql}
  [지시사항]
함수이름은 이벤트 핸들러에 ByPivot를 붙인다 
MYSQL 프로시저로 만들어 줘 
운동의 종료는 동적으로 변경될 수 있다. 
입력변수는 MEM_ID, FROM_WOR_DT, TO_WOR_DT 이고 기간은 대략 한달까지 입력될 것이다. 
JSON 이 사이즈가 클수 있으므로 충분히 커도 짤리는 않게해줘 
운동을 하지 않은 날도 결과는 나와야 한다.
DATA부분은 DATA로 
COLUMNS 부분은 COLUMNS로 
동적쿼리는 VSQL로 리턴해줘  이때, 꼭 대문자로 
node.js 로 호출하는 함수도 같이 만들어줘 
집계 컬럼이 2개인 경우는 PLAN은 _P 붙여 보여줘 PLAN은 IF PLAN_CNT > ACT_CNT 이면 0, 아니면 PLAN_CNT - ACT_CNT로 보여줘 
즉 PLAN은 계획대비 실적이 부족한 부분만 보여주는 형태로 만들어줘
[결과]
1. 집계 컬럼이 1개인 경우 
{
  "columns": [
    { "id": "1", "name": "프랭크" },
    { "id": "2", "name": "스쿼트" },
    { "id": "3", "name": "푸시업" }
  ],
  "data": [
    { "wo_dt": "03-29", "1": 0,  "2": 0,  "3": 0  },
    { "wo_dt": "03-30", "1": 0,  "2": 0,  "3": 0  },
    { "wo_dt": "03-31", "1": 30, "2": 0,  "3": 0  }
  ],
}

2. 집계 컬럼이 2개인 경우 
{
  "columns": [
    { "id": "1", "name": "프랭크" },
    { "id": "2", "name": "스쿼트" },
    { "id": "3", "name": "푸시업" }
  ],
  "data": [
    { "wo_dt": "01", "1": 45, "1_P": 0,  "2": 60, "2_P": 0,  "3": 55, "3_P": 5  },
    { "wo_dt": "02", "1": 30, "1_P": 15, "2": 0,  "2_P": 0,  "3": 0,  "3_P": 0  },
  ]
}  
[예제-함수]
1. 집계 컬럼이 1개인 경우 
DROP PROCEDURE IF EXISTS getWorkoutRecordsByPivot;
DELIMITER $$

CREATE PROCEDURE \'getWorkoutRecordsByPivot\'(
    IN  p_mem_id INT,
    IN  p_from_dt DATE,
    IN  p_to_dt DATE,
    OUT VSQL LONGTEXT,     -- 생성된 동적 쿼리 문구
    OUT DATA LONGTEXT,     -- 최종 JSON DATA 부분
    OUT COLUMNS LONGTEXT   -- 최종 JSON COLUMNS 부분
)
BEGIN
    DECLARE v_cols_expr LONGTEXT DEFAULT '';
    DECLARE v_json_expr LONGTEXT DEFAULT '';
    DECLARE v_cols_json LONGTEXT DEFAULT '';
    DECLARE v_sql       LONGTEXT DEFAULT '';

    -- JSON 사이즈 제한 해제 (충분히 크게 설정)
    SET SESSION group_concat_max_len = 4294967295; 

    -- 1) T_WORKOUT 마스터 테이블 기준 피벗 컬럼 및 COLUMNS JSON 생성
    SELECT 
        GROUP_CONCAT(
            CONCAT('COALESCE(MAX(CASE WHEN wd.WOO_ID = ''', WOO_ID, ''' THEN wd.WOD_COUNT END), 0) AS \'', WOO_ID, '\'')
            ORDER BY WOO_ID SEPARATOR ', '
        ),
        GROUP_CONCAT(
            CONCAT('''', WOO_ID, ''', \'', WOO_ID, '\'')
            ORDER BY WOO_ID SEPARATOR ', '
        ),
        JSON_ARRAYAGG(
            JSON_OBJECT('id', CAST(WOO_ID AS CHAR), 'name', WOO_NAME)
        )
    INTO v_cols_expr, v_json_expr, v_cols_json
    FROM T_WORKOUT;

    -- 2) 동적 쿼리 작성 (결과를 유저 변수 @DATA_TMP에 할당하도록 설정)
    SET v_sql = CONCAT(
        'WITH RECURSIVE date_range AS ( ',
        '    SELECT ? AS dt ',
        '    UNION ALL ',
        '    SELECT DATE_ADD(dt, INTERVAL 1 DAY) FROM date_range WHERE dt < ? ',
        '), ',
        'pivot_raw AS ( ',
        '    SELECT ',
        '        DATE_FORMAT(dr.dt, "%m-%d") AS wo_dt, ',
                 v_cols_expr,
        '    FROM date_range dr ',
        '    LEFT JOIN T_WORKOUT_RECORD wr ON wr.WOR_DT = dr.dt AND wr.MEM_ID = ? ',
        '    LEFT JOIN T_WORKOUT_DETAIL wd ON wd.WOR_ID = wr.WOR_ID ',
        '    GROUP BY dr.dt ',
        '    ORDER BY dr.dt ',
        ') ',
        'SELECT JSON_ARRAYAGG(JSON_OBJECT("wo_dt", wo_dt, ', v_json_expr, ')) ',
        'INTO @DATA_TMP FROM pivot_raw'
    );

    -- 3) OUT 변수 VSQL 할당
    SET VSQL = v_sql;

    -- 4) 동적 쿼리 실행
    SET @sql      = v_sql;
    SET @p_start  = p_from_dt;
    SET @p_end    = p_to_dt;
    SET @p_mem    = p_mem_id;

    PREPARE stmt FROM @sql;
    EXECUTE stmt USING @p_start, @p_end, @p_mem;
    DEALLOCATE PREPARE stmt;

    -- 5) 최종 결과 OUT 변수에 대입
    SET DATA = @DATA_TMP;
    SET COLUMNS = v_cols_json;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS getWorkoutRecordsPlanByPivot;
DELIMITER $$

2. 집계 컬럼이 2개인 경우 
CREATE PROCEDURE \'getWorkoutRecordsPlanByPivot\'(
    IN  p_mem_id INT,
    IN  p_from_dt DATE,
    IN  p_to_dt DATE,
    OUT VSQL LONGTEXT,     -- 생성된 동적 쿼리 문구
    OUT DATA LONGTEXT,     -- 최종 JSON DATA 부분
    OUT COLUMNS LONGTEXT   -- 최종 JSON COLUMNS 부분
)
BEGIN
    DECLARE v_cols_expr LONGTEXT DEFAULT '';
    DECLARE v_json_expr LONGTEXT DEFAULT '';
    DECLARE v_cols_json LONGTEXT DEFAULT '';
    DECLARE v_sql       LONGTEXT DEFAULT '';

    -- JSON 사이즈 제한 해제
    SET SESSION group_concat_max_len = 4294967295; 

    -- 1) T_WORKOUT 기준으로 동적 피벗 컬럼 생성
    -- 실적(WOO_ID)과 계획(WOO_ID_P) 두 가지 케이스를 생성
    SELECT 
        GROUP_CONCAT(
            CONCAT(
                'IFNULL(SUM(CASE WHEN A.WOO_ID = ''', WOO_ID, ''' THEN A.ACT_CNT END), 0) AS \'', WOO_ID, '\', ',
                'IFNULL(SUM(CASE WHEN A.WOO_ID = ''', WOO_ID, ''' THEN A.PLAN_CNT END), 0) AS \'', WOO_ID, '_P\''
            )
            ORDER BY WOO_ID SEPARATOR ', '
        ),
        GROUP_CONCAT(
            CONCAT('"', WOO_ID, '", \'', WOO_ID, '\', "', WOO_ID, '_P", \'', WOO_ID, '_P\'')
            ORDER BY WOO_ID SEPARATOR ', '
        ),
        -- COLUMNS는 요청하신 대로 마스터 ID와 NAME만 포함
        JSON_ARRAYAGG(
            JSON_OBJECT('id', CAST(WOO_ID AS CHAR), 'name', WOO_NAME)
        )
    INTO v_cols_expr, v_json_expr, v_cols_json
    FROM T_WORKOUT;

    -- 2) 동적 쿼리 작성 (전체 대문자 변환 대비 구조 작성)
    SET v_sql = CONCAT(
        'WITH RECURSIVE DATE_RANGE AS ( ',
        '    SELECT ? AS DT ',
        '    UNION ALL ',
        '    SELECT DATE_ADD(DT, INTERVAL 1 DAY) FROM DATE_RANGE WHERE DT < ? ',
        '), ',
        'BASE_DATA AS ( ',
        '   SELECT	WO_DT, ',
        '           WOO_ID, ',
        '           CASE WHEN SUM(PLAN_CNT) > SUM(ACT_CNT) THEN SUM(PLAN_CNT) - SUM(ACT_CNT) END  AS PLAN_CNT, ',
        '           SUM(ACT_CNT) AS ACT_CNT ',
        '   FROM	(',        
        '       SELECT  MEP_DATE AS WO_DT, WOO_ID, SUM(MEP_TARGET) AS PLAN_CNT, 0 AS ACT_CNT ',
        '       FROM    T_MEMBER_PLAN ',
        '       WHERE   MEM_ID = ? AND MEP_DATE BETWEEN ? AND ? ',
        '       GROUP BY MEP_DATE, WOO_ID ',
        '       UNION ALL ',
        '       SELECT  A.WOR_DT, C.WOO_ID, 0 AS PLAN_CNT, SUM(B.WOD_COUNT) AS ACT_CNT ',
        '       FROM    T_WORKOUT_RECORD A ',
        '       JOIN    T_WORKOUT_DETAIL B ON B.WOR_ID = A.WOR_ID ',
        '       JOIN    T_WORKOUT C ON C.WOO_ID = B.WOO_ID ',
        '       WHERE   A.MEM_ID = ? AND A.WOR_STATUS = "C" AND A.WOR_DT BETWEEN ? AND ? ',
        '       GROUP BY A.WOR_DT, C.WOO_ID ',
	      '   ) A',
        '   GROUP BY WO_DT, WOO_ID',       
        ') ',
        'SELECT JSON_ARRAYAGG(JSON_OBJECT("wo_dt", WO_DT, ', v_json_expr, ')) ',
        'INTO @DATA_TMP FROM ( ',
        '    SELECT DATE_FORMAT(D.DT, "%d") AS WO_DT, ', -- 요청하신 대로 날짜(일)만 표시
        '           ', v_cols_expr,
        '    FROM DATE_RANGE D ',
        '    LEFT JOIN BASE_DATA A ON A.WO_DT = D.DT ',
        '    GROUP BY D.DT ',
        '    ORDER BY D.DT ',
        ') T'
    );

    -- 3) 동적 쿼리 대문자로 리턴
    SET VSQL = UPPER(v_sql);

    -- 4) 실행
    SET @sql = v_sql;
    SET @p_start = p_from_dt; 
    SET @p_end = p_to_dt; 
    SET @p_mem = p_mem_id;

    PREPARE stmt FROM @sql;
    EXECUTE stmt USING @p_start, @p_end, @p_mem, @p_start, @p_end, @p_mem, @p_start, @p_end;
    DEALLOCATE PREPARE stmt;

    -- 5) 결과 반환
    SET DATA = IFNULL(@DATA_TMP, '[]');
    SET COLUMNS = v_cols_json;
END$$
DELIMITER ;
[이벤트핸들러]
workoutRouter.get('/getWorkoutRecordsByPivot', async (req: Request, res: Response) => {
  let apiLogEntry = null;
  try {
    const { mem_id } = req.query as { mem_id?: string };
    const { from } = req.query as { from: string };
    const { to } = req.query as { to: string };
    if (!mem_id) {
      return res.status(400).json({
        success: false,
        error: '회원 ID가 필요합니다.'
      });
    }
    if (!from) {
      return res.status(400).json({
        success: false,
        error: '시작일이 필요합니다.'
      });
    }
    if (!to) {
      return res.status(400).json({
        success: false,
        error: '종료일이 필요합니다.'
      });
    }        
    apiLogEntry = await Logger.logApiStart('GET /api/workout/getWorkoutRecordsByPivot', [mem_id, from, to]);
    const records = await getWorkoutRecordsByPivot(Number(mem_id), from, to);
    
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
  `;
    res.json({
      success: true,
      data: prompt,
      timestamp: new Date().toISOString()
    });      
    await Logger.logApiSuccess(apiLogEntry);
  } catch (error) {
    console.log('Error during backend prompt generation:', (error as Error).message || error);
    await Logger.logApiError(apiLogEntry, error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default systemRouter;