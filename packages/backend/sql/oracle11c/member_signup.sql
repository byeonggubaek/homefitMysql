CREATE OR REPLACE PROCEDURE member_signup(
  p_mem_id VARCHAR2,
  p_mem_name NVARCHAR2,
  p_mem_password VARCHAR2,
  p_mem_img NVARCHAR2,
  p_mem_sex NVARCHAR2,
  p_mem_age NUMBER,
  p_result OUT VARCHAR2
) IS
BEGIN
  INSERT INTO T_MEMBER (MEM_ID, MEM_NAME, MEM_NICKNAME, MEM_PASSWORD, MEM_IMG, MEM_SEX, MEM_AGE, MES_ID)
  VALUES (
    p_mem_id, 
    p_mem_name, 
    member_hash_password(p_mem_id, p_mem_password),  -- 닉네임에 해싱
    p_mem_password,  -- 패스워드 필드에 원본? 보안상 해싱된 값 저장 권장
    p_mem_img, 
    p_mem_sex, 
    p_mem_age,
    'MES00001'
  );
  
  COMMIT;  -- 트랜잭션 완료
  p_result := 'SUCCESS';
EXCEPTION
  WHEN DUP_VAL_ON_INDEX THEN
    p_result := 'DUPLICATE_ID';
  WHEN OTHERS THEN
    p_result := 'ERROR: ' || SQLERRM;
END;
/
