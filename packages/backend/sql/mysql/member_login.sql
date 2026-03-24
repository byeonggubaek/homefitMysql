CREATE PROCEDURE `member_login`(
    IN  p_mem_id_act    VARCHAR(50),
    IN  p_mem_password 	VARCHAR(256),
    OUT p_result   VARCHAR(20)
)
BEGIN
    -- member_verify_password()가 TINYINT(1) (0/1) 을 리턴한다고 가정
    IF member_verify_password(p_mem_id_act, p_mem_password) = 1 THEN
        SET p_result := 'SUCCESS';
    ELSE
        SET p_result := 'FAIL';
    END IF;
END