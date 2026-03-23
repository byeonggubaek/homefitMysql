CREATE OR REPLACE FUNCTION member_hash_password(
  p_mem_id VARCHAR2,      -- ID salt로 사용
  p_password VARCHAR2 
) RETURN VARCHAR2 DETERMINISTIC IS
  l_hash VARCHAR2(256);
BEGIN
  RETURN p_password;
END;
/