CREATE FUNCTION `member_verify_password`(
    p_mem_id_view	VARCHAR(50),
    p_mem_password 	VARCHAR(256)
) RETURNS tinyint(1)
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE l_stored_hash VARCHAR(256);

    -- 저장된 해시 조회
    SELECT MEM_PASSWORD
      INTO l_stored_hash
      FROM T_MEMBER
     WHERE MEM_ID_VIEW = p_mem_id_view;

    -- 입력값 해싱 후 비교 (member_hash_password는 이미 MySQL에 만들어져 있다고 가정)
    IF l_stored_hash = member_hash_password(p_mem_id_view, p_mem_password) THEN
        RETURN 1;
    ELSE
        RETURN 0;
    END IF;
END