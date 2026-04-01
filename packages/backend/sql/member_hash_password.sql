DROP FUNCTION IF EXISTS member_hash_password;

DELIMITER $$

CREATE FUNCTION member_hash_password(
    p_mem_id_view   VARCHAR(50),
    p_mem_password  VARCHAR(256)
) 
RETURNS VARCHAR(64)
DETERMINISTIC
NO SQL
BEGIN
    RETURN SHA2(CONCAT(p_mem_id_view, '|HOMEFIT|', p_mem_password), 256);
END$$

DELIMITER ;