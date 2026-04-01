DELIMITER $$

DROP PROCEDURE IF EXISTS usp_getWorkoutRecords$$
CREATE PROCEDURE usp_getWorkoutRecords(
    IN  p_mem_id INT,
    IN  p_from_dt   DATE,
    IN  p_to_dt     DATE
)
BEGIN
    DECLARE v_cols_expr   LONGTEXT DEFAULT NULL;
    DECLARE v_json_expr   LONGTEXT DEFAULT NULL; 
    DECLARE v_sql         LONGTEXT DEFAULT NULL;
    
    SET SESSION group_concat_max_len = 1024000;

    -- 1️⃣ 피벗을 위한 동적 SQL 표현식 생성
    SELECT GROUP_CONCAT(
             DISTINCT CONCAT(
               'COALESCE(SUM(CASE WHEN x.WOO_ID = ''',
               B.WOO_ID,
               ''' THEN x.WOD_COUNT ELSE 0 END), 0) AS `',
               C.WOO_ID_VIEW,
               '`'
             )
             ORDER BY B.WOO_ID 
             SEPARATOR ', '
           )
      INTO v_cols_expr
      FROM T_WORKOUT_RECORD A
      JOIN T_WORKOUT_DETAIL B ON B.WOR_ID = A.WOR_ID
      JOIN T_WORKOUT C ON C.WOO_ID = B.WOO_ID
     WHERE A.MEM_ID = p_mem_id
       AND A.WOR_DT BETWEEN p_from_dt AND p_to_dt
       AND A.WOR_STATUS = 'C';

    -- 2️⃣ [결과 1] 사용된 운동 목록 (Columns) 반환
	SELECT 
           C.WOO_ID_VIEW AS id, 
           JSON_UNQUOTE(C.WOO_NAME) AS name
      FROM T_WORKOUT_RECORD A
      JOIN T_WORKOUT_DETAIL B ON B.WOR_ID = A.WOR_ID
      JOIN T_WORKOUT C ON C.WOO_ID = B.WOO_ID
     WHERE A.MEM_ID = p_mem_id
       AND A.WOR_DT BETWEEN p_from_dt AND p_to_dt
       AND A.WOR_STATUS = 'C'
     GROUP BY C.WOO_ID, C.WOO_ID_VIEW, C.WOO_NAME
     ORDER BY C.WOO_ID; -- 이제 그룹화된 컬럼이므로 안전하게 정렬 가능합니다.

    -- 3️⃣ [결과 2] 날짜별 운동 기록 (Data) 반환
    IF v_cols_expr IS NULL OR v_cols_expr = '' THEN
        -- 데이터가 없을 경우 날짜만 있는 빈 테이블 반환 (선택 사항)
        SELECT DATE_FORMAT(dt, '%Y-%m-%d') AS wo_dt 
        FROM (
            WITH RECURSIVE date_range AS (
                SELECT DATE(p_from_dt) AS dt
                UNION ALL
                SELECT DATE_ADD(dt, INTERVAL 1 DAY)
                FROM date_range WHERE dt < DATE(p_to_dt)
            )
            SELECT dt FROM date_range
        ) empty_p;
    ELSE
        SET v_sql = CONCAT(
            'SELECT DATE_FORMAT(p.dt, "%Y-%m-%d") AS wo_dt, ', v_cols_expr, 
            ' FROM (
                WITH RECURSIVE date_range AS (
                    SELECT DATE(''', p_from_dt, ''') AS dt
                    UNION ALL
                    SELECT DATE_ADD(dt, INTERVAL 1 DAY)
                    FROM date_range WHERE dt < DATE(''', p_to_dt, ''')
                ),
                base_data AS (
                    SELECT dr.dt, wd.WOO_ID, wd.WOD_COUNT
                    FROM date_range dr
                    LEFT JOIN T_WORKOUT_RECORD wr ON DATE(wr.WOR_DT) = dr.dt 
                        AND wr.MEM_ID = ', p_mem_id, ' AND wr.WOR_STATUS = ''C''
                    LEFT JOIN T_WORKOUT_DETAIL wd ON wd.WOR_ID = wr.WOR_ID
                )
                SELECT dt, ', v_cols_expr, '
                FROM base_data x
                GROUP BY dt
                ORDER BY dt
            ) p'
        );

        SET @sql = v_sql;
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;