DROP PROCEDURE IF EXISTS getWorkoutRecordsByPivot;
DELIMITER $$

CREATE PROCEDURE `getWorkoutRecordsByPivot`(
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
            CONCAT('COALESCE(MAX(CASE WHEN wd.WOO_ID = ''', WOO_ID, ''' THEN wd.WOD_COUNT END), 0) AS `', WOO_ID, '`')
            ORDER BY WOO_ID SEPARATOR ', '
        ),
        GROUP_CONCAT(
            CONCAT('''', WOO_ID, ''', `', WOO_ID, '`')
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