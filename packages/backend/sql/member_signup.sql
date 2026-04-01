DROP PROCEDURE IF EXISTS member_signup;

DELIMITER $$

CREATE PROCEDURE member_signup(
    IN  p_mem_id_view     VARCHAR(50),
    IN  p_mem_name        VARCHAR(50),
    IN  p_mem_nickname    VARCHAR(50),
    IN  p_mem_password    VARCHAR(255),
    IN  p_mem_img         VARCHAR(256),
    IN  p_mem_pnumber     VARCHAR(64),
    IN  p_mem_email       VARCHAR(512),
    IN  p_mem_sex         VARCHAR(5),
    IN  p_mem_age         INT,
    IN  p_mes_id          INT,
    OUT p_result          VARCHAR(20),
    OUT p_new_id          INT
)
BEGIN
    DECLARE hashed_password VARCHAR(64);

    SET hashed_password = member_hash_password(p_mem_id_view, p_mem_password);

    IF EXISTS (
        SELECT 1
          FROM T_MEMBER
         WHERE MEM_ID_VIEW = p_mem_id_view
    ) THEN
        SET p_result = 'DUPLICATE_ID';
        SET p_new_id = NULL;
    ELSE
        INSERT INTO T_MEMBER (
            MEM_ID_VIEW,
            MEM_NAME,
            MEM_NICKNAME,
            MEM_PASSWORD,
            MEM_IMG,
            MEM_PNUMBER,
            MEM_EMAIL,
            MEM_SEX,
            MEM_AGE,
            MES_ID
        )
        VALUES (
            p_mem_id_view,
            p_mem_name,
            p_mem_nickname,
            hashed_password,
            p_mem_img,
            p_mem_pnumber,
            p_mem_email,
            p_mem_sex,
            p_mem_age,
            p_mes_id
        );

        SET p_result = 'SUCCESS';
        SET p_new_id = LAST_INSERT_ID();
    END IF;
END$$

DELIMITER ;