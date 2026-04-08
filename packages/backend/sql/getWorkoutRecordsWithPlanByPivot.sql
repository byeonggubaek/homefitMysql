DROP PROCEDURE IF EXISTS getWorkoutRecordsWithPlanByPivot;
DELIMITER $$

CREATE PROCEDURE `getWorkoutRecordsWithPlanByPivot`(
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
                'IFNULL(SUM(CASE WHEN A.WOO_ID = ''', WOO_ID, ''' THEN A.ACT_CNT END), 0) AS `', WOO_ID, '`, ',
                'IFNULL(SUM(CASE WHEN A.WOO_ID = ''', WOO_ID, ''' THEN A.PLAN_CNT END), 0) AS `', WOO_ID, '_P`'
            )
            ORDER BY WOO_ID SEPARATOR ', '
        ),
        GROUP_CONCAT(
            CONCAT('"', WOO_ID, '", `', WOO_ID, '`, "', WOO_ID, '_P", `', WOO_ID, '_P`')
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
        '   SELECT ? AS DT ',
        '   UNION ALL ',
        '   SELECT DATE_ADD(DT, INTERVAL 1 DAY) FROM DATE_RANGE WHERE DT < ? ',
        '), ',
        'BASE_DATA AS ( ',
        '   SELECT	WO_DT, ',
        '           WOO_ID, ',
        '           CASE WHEN SUM(PLAN_CNT) > SUM(ACT_CNT) THEN SUM(PLAN_CNT) - SUM(ACT_CNT) END  AS PLAN_CNT, ',
        '           SUM(ACT_CNT) AS ACT_CNT ',
        '   FROM	(',        
        '       SELECT  MEP_DATE AS WO_DT, WOO_ID, SUM(MEP_TARGET_REPS * MEP_TARGET_SETS) AS PLAN_CNT, 0 AS ACT_CNT ',
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