CREATE PROCEDURE `member_signup`(
  IN p_id VARCHAR(50),
  IN p_name VARCHAR(100),
  IN p_password VARCHAR(255),
  IN p_img VARCHAR(255),
  IN p_sex VARCHAR(10),
  IN p_age INT,
  OUT p_result VARCHAR(20)
)
BEGIN
  DECLARE hashed_password VARCHAR(255);
  
  -- 패스워드 해싱 (SHA2-512 사용, Oracle 함수 대체)
  SET hashed_password = SHA2(CONCAT(p_id, p_password), 512);
  
  -- 중복 ID 체크 및 삽입
  IF EXISTS (SELECT 1 FROM MEMBER WHERE ID = p_id) THEN
    SET p_result = 'DUPLICATE_ID';
  ELSE
    INSERT INTO MEMBER (ID, NAME, PASSWORD, IMG, SEX, AGE, MEMBERSHIP)
    VALUES (p_id, p_name, hashed_password, p_img, p_sex, p_age, 'N');
    SET p_result = 'SUCCESS';
  END IF;
END