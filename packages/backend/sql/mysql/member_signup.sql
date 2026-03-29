CREATE PROCEDURE `member_signup`(
  IN p_mem_id_view VARCHAR(50),
  IN p_mem_name VARCHAR(50),
  IN p_mem_nickname VARCHAR(50),
  IN p_mem_password VARCHAR(255),
  IN p_mem_img VARCHAR(256),
  IN p_mem_sex VARCHAR(5),
  IN p_mem_age INT,
  OUT p_result VARCHAR(20)
)
BEGIN
  DECLARE hashed_password VARCHAR(255);
  
  -- 패스워드 해싱 (SHA2-512 사용, Oracle 함수 대체)
  SET hashed_password = SHA2(CONCAT(p_mem_id_view, p_mem_password), 512);
  
  -- 중복 ID 체크 및 삽입
  IF EXISTS (SELECT 1 FROM T_MEMBER WHERE MEM_ID_VIEW = p_mem_id_view) THEN
    SET p_result = 'DUPLICATE_ID';
  ELSE
    INSERT INTO T_MEMBER (MEM_ID_VIEW, MEM_NAME, MEM_NICKNAME, MEM_PASSWORD, MEM_IMG, MEM_SEX, MEM_AGE, MES_ID)
    VALUES (p_mem_id_view, p_mem_name, p_mem_nickname, hashed_password, p_mem_img, p_mem_sex, p_mem_age, 1);
    SET p_result = 'SUCCESS';
  END IF;
END