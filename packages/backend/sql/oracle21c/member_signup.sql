CREATE OR REPLACE PROCEDURE member_signup(
  p_id VARCHAR2,
  p_name NVARCHAR2,
  p_password VARCHAR2,
  p_img NVARCHAR2,
  p_sex NVARCHAR2,
  p_age NUMBER,
  p_result OUT VARCHAR2
) IS
BEGIN
  INSERT INTO MEMBER (ID, NAME, PASSWORD, IMG, SEX, AGE, MEMBERSHIP)
  VALUES (
    p_id, 
    p_name, 
    member_hash_password(p_id, p_password),  -- 👈 자동 해싱!
    p_img, 
    p_sex, 
    p_age,
    'N'  -- 기본 회원
  );
  
  p_result := 'SUCCESS';
EXCEPTION
  WHEN DUP_VAL_ON_INDEX THEN
    p_result := 'DUPLICATE_ID';
END;
/
