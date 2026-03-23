CREATE FUNCTION `member_hash_password`(
    p_id       VARCHAR(255),
    p_password VARCHAR(255)
) RETURNS varchar(64) CHARSET utf8mb4
    NO SQL
    DETERMINISTIC
BEGIN
    RETURN SHA2(CONCAT(p_id, '|HOMEFIT|', p_password), 256);
END