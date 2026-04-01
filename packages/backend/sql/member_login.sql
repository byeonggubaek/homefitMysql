DROP PROCEDURE IF EXISTS member_login;

DELIMITER $$

CREATE PROCEDURE member_login(
    IN  p_mem_id_view    VARCHAR(50),
    IN  p_mem_password   VARCHAR(256)
)
BEGIN
    IF member_verify_password(p_mem_id_view, p_mem_password) = 1 THEN
        SELECT  A.MEM_ID,
                A.MEM_ID_VIEW,
                A.MEM_NAME,
                A.MEM_NICKNAME,
                A.MEM_IMG,
                A.MEM_PNUMBER,
                A.MEM_EMAIL,
                C.MIN_NAME AS MEM_SEX,
                A.MEM_AGE,
                A.MEM_POINT,
                A.MEM_EXP_POINT,
                A.MEM_LVL,
                A.MEM_STREAK,
                A.MES_ID,
                B.MES_NAME,
                B.MES_FEE
        FROM    T_MEMBER A
        JOIN    T_MEMBERSHIP B ON B.MES_ID = A.MES_ID
        JOIN    T_MINOR_DESC C ON C.COD_ID = 'COD00003' AND C.MIN_ID = A.MEM_SEX
        WHERE   A.MEM_ID_VIEW = p_mem_id_view;
    END IF;
END$$

DELIMITER ;