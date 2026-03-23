CREATE OR REPLACE PROCEDURE member_login(
  p_mem_id VARCHAR2,
  p_mem_password VARCHAR2,
  p_result OUT VARCHAR2
) IS
BEGIN
  IF member_verify_password(p_mem_id, p_mem_password) THEN
    p_result := 'SUCCESS';
  ELSE
    p_result := 'FAIL';
  END IF;
END;
/
