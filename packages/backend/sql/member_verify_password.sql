DROP FUNCTION IF EXISTS member_verify_password;

DELIMITER $$

CREATE FUNCTION member_verify_password(
    p_mem_id_view   VARCHAR(50),
    p_mem_password  VARCHAR(256)
) 
RETURNS TINYINT(1)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE l_stored_hash VARCHAR(64);  -- SHA2(256) 결과는 64자리

    -- 저장된 해시 조회 (NULL 체크 추가)
    SELECT MEM_PASSWORD
      INTO l_stored_hash
      FROM T_MEMBER
     WHERE MEM_ID_VIEW = p_mem_id_view
     LIMIT 1;  -- 단일 행 보장

    -- 회원 없거나 해시 NULL이면 false
    IF l_stored_hash IS NULL THEN
        RETURN 0;
    END IF;

    -- 입력값 해싱 후 비교
    IF l_stored_hash = member_hash_password(p_mem_id_view, p_mem_password) THEN
        RETURN 1;
    ELSE
        RETURN 0;
    END IF;
END$$

DELIMITER ;