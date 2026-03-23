CREATE OR REPLACE FUNCTION member_hash_password(
  p_id VARCHAR2,      -- ID salt로 사용
  p_password VARCHAR2 
) RETURN VARCHAR2 DETERMINISTIC IS
  l_hash VARCHAR2(256);
BEGIN
  SELECT STANDARD_HASH(
    p_id || '|HOMEFIT|' || p_password,  -- ID + 고정 salt
    'SHA256'
  ) INTO l_hash FROM DUAL;
  RETURN l_hash;
END;
/