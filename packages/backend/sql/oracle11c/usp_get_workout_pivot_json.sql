create or replace PROCEDURE usp_get_workout_pivot_json(
  p_mem_join_id NVARCHAR2,
  p_from_dt   DATE,
  p_to_dt     DATE,
  p_result_json OUT CLOB
) 
IS
  v_cols        CLOB;  -- PIVOT IN 절
  v_sql_data    CLOB;  -- 피벗 + JSON 배열 SQL
  v_data_json   CLOB;  -- data 부분 JSON
  v_cols_json   CLOB;  -- columns 부분 JSON
BEGIN
  -- 1) PIVOT IN 절 컬럼 목록
  SELECT LISTAGG(
           '''' || woo_id || ''' AS "' || woo_id || '"',
           ' , '
         ) WITHIN GROUP (ORDER BY woo_id)
    INTO v_cols 
    FROM (
      SELECT DISTINCT B.woo_id
      FROM t_workout_record A
           JOIN t_workout_detail B ON B.wor_id = A.wor_id
      WHERE A.mem_join_id = p_mem_join_id
        AND A.wor_dt BETWEEN p_from_dt AND p_to_dt
    );
--      DBMS_OUTPUT.PUT_LINE(v_cols);  -- 크기 확인


  -- 2) columns: workout_id / workout_name 리스트 JSON
  SELECT '[' ||
       LISTAGG('{"id":' || w.woo_id || ',"name":"' || 
               REPLACE(CAST(w.woo_name AS VARCHAR2(4000)), '"', '\"') || '"}', ',') 
               WITHIN GROUP (ORDER BY w.woo_id) ||
       ']'
    INTO v_cols_json
    FROM (
      SELECT DISTINCT C.woo_id, C.woo_name
      FROM t_workout_record A
           JOIN t_workout_detail B ON B.wor_id = A.wor_id
           JOIN t_workout C        ON C.woo_id = B.woo_id
      WHERE A.mem_join_id = p_mem_join_id
        AND A.wor_dt BETWEEN p_from_dt AND p_to_dt
    ) w;

  -- 3) data: 동적 PIVOT 결과를 JSON 배열로 만드는 SQL
  v_sql_data := '
    WITH workout AS (
      SELECT DISTINCT B.woo_id
      FROM t_workout_record A
           JOIN t_workout_detail B ON B.wor_id = A.wor_id
      WHERE A.mem_join_id = ''' || p_mem_join_id || '''
        AND A.wor_dt BETWEEN ''' || p_from_dt || ''' AND ''' || p_to_dt || '''
    ), date_range AS (
      SELECT 
        TRUNC(TO_DATE(''' || p_from_dt || ''', ''YYYY-MM-DD'')) + LEVEL - 1 AS date_val
      FROM DUAL 
      CONNECT BY LEVEL <= TRUNC(TO_DATE(''' || p_to_dt || ''', ''YYYY-MM-DD'') - TO_DATE(''' || p_from_dt || ''', ''YYYY-MM-DD'')) + 1
    )
    SELECT  ''['' ||
           LISTAGG(
             ''{"wo_dt":"'' || wo_dt || ''"'' || '; 

  FOR c IN (
    SELECT DISTINCT B.woo_id
    FROM t_workout_record A
         JOIN t_workout_detail B ON B.wor_id = A.wor_id
    WHERE A.mem_join_id = p_mem_join_id
      AND A.wor_dt BETWEEN p_from_dt AND p_to_dt
    ORDER BY B.woo_id      
  ) LOOP
    v_sql_data := v_sql_data ||
                  ''',' || c.woo_id || ':'' || ' || c.woo_id || '||';
  END LOOP;

  v_sql_data := v_sql_data || '
             ''}''
             )  
             WITHIN GROUP (ORDER BY wo_dt) ||
           '']'' AS j
      FROM (
        SELECT *
        FROM (
          SELECT TO_CHAR(dr.date_val, ''DD'') wo_dt, 
                 w.woo_id,
                 0 count
          FROM   date_range dr
          CROSS JOIN t_workout w

          UNION ALL 

          SELECT TO_CHAR(A.wor_dt, ''DD''),
                 B.woo_id,
                 B.wod_count
          FROM   t_workout_record A
                 JOIN t_workout_detail B ON B.wor_id = A.wor_id
          WHERE  A.mem_join_id = ''' || p_mem_join_id || '''
          AND    A.wor_dt BETWEEN ''' || p_from_dt || ''' AND ''' || p_to_dt || '''
        )
        PIVOT (
          SUM(count)
          FOR woo_id IN (' || v_cols || ')
        )
      )
      ';
--    DBMS_OUTPUT.PUT_LINE(v_sql_data);  -- 크기 확인

  EXECUTE IMMEDIATE v_sql_data
    INTO v_data_json;

--  DBMS_OUTPUT.PUT_LINE(v_cols_json);  -- 크기 확인
--  DBMS_OUTPUT.PUT_LINE(v_data_json);  -- 크기 확인
  -- 4) columns + data 하나로 합치기
   p_result_json := '{
    "columns": ' || NVL(v_cols_json, '[]') || ',
    "data": ' || NVL(v_data_json, '[]') || '
  }';
  -- DBMS_OUTPUT.PUT_LINE(p_result_json);  -- 크기 확인  
END;