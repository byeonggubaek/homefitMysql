CREATE OR REPLACE PROCEDURE member_login(
  p_id VARCHAR2,
  p_password VARCHAR2,
  p_result OUT VARCHAR2
) IS
BEGIN
  IF member_verify_password(p_id, p_password) THEN
    p_result := 'SUCCESS';
  ELSE
    p_result := 'FAIL';
  END IF;
END;
/
