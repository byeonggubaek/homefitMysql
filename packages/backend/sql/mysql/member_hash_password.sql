CREATE FUNCTION `member_hash_password`(
    p_mem_id_act VARCHAR(50),
    p_mem_password 	VARCHAR(256)
) RETURNS varchar(64) CHARSET utf8mb4
    NO SQL
    DETERMINISTIC
BEGIN
    RETURN SHA2(CONCAT(p_mem_id_act, '|HOMEFIT|', p_mem_password), 256);
END