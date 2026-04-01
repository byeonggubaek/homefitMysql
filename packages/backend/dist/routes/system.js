import express from 'express';
import Logger from '../logger.js';
import { getScripts } from '../db.js';
const systemRouter = express.Router();
systemRouter.post("/getSelectPrompt", async (req, res) => {
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
        apiLogEntry = await Logger.logApiStart('POST /api/getSelectPrompt', [method, eventHandler, sql]);
        // 2. 테이블 추출 및 중복 제거
        const tableRegex = /(?:FROM|JOIN)\s+([A-Z0-9_]+)/gi;
        let match;
        const tableSet = new Set(); // Set으로 중복 자동 제거
        while ((match = tableRegex.exec(sql)) !== null) {
            const tableName = match[1].toUpperCase();
            tableSet.add(tableName);
        }
        const tables = Array.from(tableSet);
        const scripts = await getScripts(tables);
        if (scripts.length == 0) {
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
  app.get('/getMembership', async (req, res) => {
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
            else {
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
  app.post('/getMembership', async (req, res) => {
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
            res.json({
                success: true,
                data: prompt,
                timestamp: new Date().toISOString()
            });
            await Logger.logApiSuccess(apiLogEntry);
        }
    }
    catch (error) {
        console.log('Error during backend prompt generation:', error.message || error);
        await Logger.logApiError(apiLogEntry, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
systemRouter.post("/getInsertPrompt", async (req, res) => {
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
        apiLogEntry = await Logger.logApiStart('POST /api/getInsertPrompt', [eventHandler, table]);
        // 2. 테이블 추출 및 중복 제거
        const tableRegex = /([^\s,]+)/gi;
        let match;
        const tableSet = new Set(); // Set으로 중복 자동 제거
        while ((match = tableRegex.exec(table)) !== null) {
            // 1. match[1]로 추출된 단어를 가져옴
            // 2. toUpperCase()로 대소문자 구분 없이 동일하게 처리 (중복 제거의 핵심)
            const tableName = match[1].toUpperCase();
            // 3. Set에 추가 (이미 존재하면 자동으로 무시됨)
            tableSet.add(tableName);
        }
        const tables = Array.from(tableSet);
        const scripts = await getScripts(tables);
        if (scripts.length == 0) {
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
[지시사항]
입력된 테이블들의 칼럼에 대응되는 tyype을 선언하고  DB에 반영하는 Backend express 이벤트 핸들러를 만들어 줘
AUTO_INCREMENT 되는 값은 파라미터로 넘어오지 않고 자동채번한 후 
예제와 같이 AUTO가 빠진 칼럼에 PREFIX + 5자리 숫자 형태로 만들어서 업데이트 해주는 형태로 만들어 줘
async (req, res) 에서 type은 지정하지 마
날자는 입력값이 넘어오지 않으면 현재 날짜로 입력되도록 만들어 줘
프라이머리 키를 리턴해줘 
이때, withTransaction 함수로 감싸서 트랜잭션이 적용된 형태로 만들어 줘
import문은 다 제외해줘
[예제]
export interface T_ACHIEVEMENT {
    ACH_AUTO_ID?: number;   // AUTO_INCREMENT로 생성되는 내부 ID
    ACH_ID: string;         // 업적 ID (예: ACH_00001)
    ACH_NAME: string;       // 업적 명
    ACH_IMG?: string | null; // 업적 이미지 경로
    ACH_DESC?: string | null; // 업적 설명
}

app.post('/insertAchievement', async (req, res) => {
    let apiLogEntry = null;
    try {
        const { ach_name, ach_img, ach_desc } = req.body;

        // 필수값 검증
        if (!ach_name) {
            return res.status(400).json({
                success: false,
                error: '업적 이름(ach_name)이 필요합니다.'
            });
        }

        apiLogEntry = await Logger.logApiStart('POST /api/insertAchievement', [ach_name, ach_desc]);

        const achievementData: T_ACHIEVEMENT = {
            ACH_ID: '', // 서비스 내부에서 생성 예정
            ACH_NAME: ach_name,
            ACH_IMG: ach_img || null,
            ACH_DESC: ach_desc || null
        };

        const result = await insertAchievement(achievementData);

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

export const insertAchievement = async (P_ACH: T_ACHIEVEMENT): Promise<{ ACH_AUTO_ID: number, ACH_ID: string }> => {
    return await withTransaction(async (conn: PoolConnection) => {
        const [insertResult] = await execute(conn,
            \`
INSERT INTO T_ACHIEVEMENT (ACH_ID, ACH_NAME, ACH_IMG, ACH_DESC) 
VALUES (?, ?, ?, ?)
            \`,
            [
              '', 
              P_ACH.ACH_NAME, 
              P_ACH.ACH_IMG ?? null, 
              P_ACH.ACH_DESC ?? null
            ] 
        );

        const newAutoId = (insertResult as any).insertId;
        const formattedId = \`ACH\${String(newAutoId).padStart(5, '0')}\`;

        await await execute(conn,
            \`
            UPDATE T_ACHIEVEMENT 
            SET ACH_ID = ? 
            WHERE ACH_AUTO_ID = ?
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
        }
    }
    catch (error) {
        console.log('Error during backend prompt generation:', error.message || error);
        await Logger.logApiError(apiLogEntry, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
export default systemRouter;
