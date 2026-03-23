CREATE OR REPLACE FUNCTION member_verify_password(
  p_mem_id VARCHAR2,
  p_mem_password VARCHAR2
) RETURN BOOLEAN IS
  l_stored_hash VARCHAR2(256);
BEGIN
  -- MEMBER 테이블에서 저장된 해시 조회
  SELECT MEM_PASSWORD INTO l_stored_hash
  FROM T_MEMBER 
  WHERE p_mem_id = p_mem_id;
  
  -- 입력값 해싱 후 비교
  RETURN l_stored_hash = member_hash_password(p_mem_id, p_mem_password);
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RETURN FALSE;
END;
/
