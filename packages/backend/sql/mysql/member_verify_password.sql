--SHOW GLOBAL VARIABLES LIKE 'log_bin_trust_function_creators';
--SET GLOBAL log_bin_trust_function_creators = 1;

CREATE FUNCTION `member_verify_password`(
    p_id            VARCHAR(255),
    p_input_password VARCHAR(255)
) RETURNS tinyint(1)
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE l_stored_hash VARCHAR(256);

    -- 저장된 해시 조회
    SELECT PASSWORD
      INTO l_stored_hash
      FROM MEMBER
     WHERE ID = p_id;

    -- 입력값 해싱 후 비교 (member_hash_password는 이미 MySQL에 만들어져 있다고 가정)
    IF l_stored_hash = member_hash_password(p_id, p_input_password) THEN
        RETURN 1;
    ELSE
        RETURN 0;
    END IF;
END