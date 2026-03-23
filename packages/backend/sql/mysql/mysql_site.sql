-- Copyright : Copyright (c) 2026 by White Dog
-- Author    : 109 
-- History   : 2026-02-03 - 최초 작성 
-- Remark    : MySQL 용 SQL

--------------------------------------------------------------------------------------------------------------------------------
-- 메뉴삭제 
--------------------------------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS T_NAV_SUB_ITEM;
DROP TABLE IF EXISTS T_NAV_ITEM;

--------------------------------------------------------------------------------------------------------------------------------
-- 메뉴
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_NAV_ITEM
(
    NAV_ID      VARCHAR(5) NOT NULL,
    NAV_NAME    VARCHAR(50) NOT NULL,
    NAV_IMG     VARCHAR(256) NULL,
    NAV_DESC	VARCHAR(512) NULL,
    CONSTRAINT T_NAV_ITEM_PK PRIMARY KEY (NAV_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO T_NAV_ITEM VALUES
('M0001', '운동', '/menu/T_WORKOUT.jpg','운동을 측정하고 기록합니다.');
INSERT INTO T_NAV_ITEM VALUES
('M0002', '기록', '/menu/history.jpg','운동 성과를 확인합니다.');
INSERT INTO T_NAV_ITEM VALUES
('M0003', '보상', '/menu/reward.jpg','포인트, 업적, 순위를 확인하며 쇼핑몰에서 운동용품을 구입할 수 있습니다.');
INSERT INTO T_NAV_ITEM VALUES
('M0004', '내정보', '/menu/member.jpg','개인 정보를 관리합니다.');

SELECT * FROM T_NAV_ITEM;

--------------------------------------------------------------------------------------------------------------------------------
-- 상세메뉴
--------------------------------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS T_NAV_SUB_ITEM;

CREATE TABLE T_NAV_SUB_ITEM
(
    NAV_ID			VARCHAR(5) NOT NULL,
    NAV_SUB_ID		VARCHAR(5) NOT NULL,
    NAV_SUB_NAME 	VARCHAR(50) NOT NULL,
    NAV_SUB_IMG   	VARCHAR(256) NULL,
    NAV_SUB_DESC	VARCHAR(512) NULL,
    NAV_SUB_PAGE  	VARCHAR(256) NOT NULL,
    NVA_SUB_HREF  	VARCHAR(256) NOT NULL,
    CONSTRAINT T_NAV_SUB_ITEM_PK PRIMARY KEY (NAV_ID, NAV_SUB_ID),
    CONSTRAINT T_NAV_SUB_ITEM_NAV_ID_FK
        FOREIGN KEY (NAV_ID) REFERENCES T_NAV_ITEM(NAV_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO T_NAV_SUB_ITEM VALUES
('M0001', 'S0001', '운동하기','/menu/tracking.jpg', '프로그램에 따라 운동을 수행합니다.', 'T_WORKOUTTracking', '/T_WORKOUT/tracking');
INSERT INTO T_NAV_SUB_ITEM VALUES
('M0002', 'S0001', '운동내역','/menu/state.jpg', '운동 내역을 확인합니다.', 'HistoryState', '/history/state');
INSERT INTO T_NAV_SUB_ITEM VALUES
('M0002', 'S0002', '콘텐츠제작','/menu/content.jpg', '운동 내역으로 SNS 콘텐츠를 자동 생성합니다.', 'HistoryContent', '/history/content');
INSERT INTO T_NAV_SUB_ITEM VALUES
('M0003', 'S0001', '포인트','/menu/point.jpg', '운동 포인트를 확인합니다.', 'RewardPoint', '/reward/point');
INSERT INTO T_NAV_SUB_ITEM VALUES
('M0003', 'S0002', '업적','/menu/achievement.jpg', '운동 업적을 확인합니다.', 'RewardAchievement', '/reward/achievement');
INSERT INTO T_NAV_SUB_ITEM VALUES
('M0003', 'S0003', '순위','/menu/ranking.jpg', '운동 순위를 확인합니다.', 'RewardRanking', '/reward/ranking');
INSERT INTO T_NAV_SUB_ITEM VALUES
('M0003', 'S0004', '쇼핑몰','/menu/mall.jpg', '굿즈 또는 운동용품을 구매합니다.', 'RewardMall', '/reward/mall');
INSERT INTO T_NAV_SUB_ITEM VALUES
('M0004', 'S0001', '프로필','/menu/profile.jpg', '개인 정보를 관리합니다.', 'MemberProfile', '/member/profile');
INSERT INTO T_NAV_SUB_ITEM VALUES
('M0004', 'S0002', '회원등록','/menu/register.png', '개인 정보를 등록합니다.', 'MemberRegister', '/member/register');
INSERT INTO T_NAV_SUB_ITEM VALUES
('M0004', 'S0003', '운동목표','/menu/plan.jpg', '운동 목표를 설정하고 관리합니다.', 'MemberPlan', '/member/plan');
INSERT INTO T_NAV_SUB_ITEM VALUES
('M0004', 'S0004', '로그인','/menu/login.png', '로그인합니다..', 'MemberLogin', '/member/login');

SELECT * FROM T_NAV_SUB_ITEM;

--------------------------------------------------------------------------------------------------------------------------------
-- 코드삭제 
--------------------------------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS T_MINOR_DESC;
DROP TABLE IF EXISTS T_CODE_DESC;

--------------------------------------------------------------------------------------------------------------------------------
-- 코드 정의서
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_CODE_DESC
(
    COD_ID   VARCHAR(5) NOT NULL,
    COD_NAME VARCHAR(100) NOT NULL,
    CONSTRAINT T_CODE_DESC_PK PRIMARY KEY (COD_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO T_CODE_DESC VALUES ('C0001', 'Payment Status');
INSERT INTO T_CODE_DESC VALUES ('C0002', 'Payment Method');
INSERT INTO T_CODE_DESC VALUES ('C0003', 'Sex');
INSERT INTO T_CODE_DESC VALUES ('C0004', 'Membership');

CREATE TABLE T_MINOR_DESC
(
    COD_ID		VARCHAR(5) NOT NULL,
    MIN_ID      VARCHAR(5) NOT NULL,
    MIN_NAME    VARCHAR(100) NOT NULL,
    MIN_ORD     INT NOT NULL,
    CONSTRAINT T_MINOR_DESC_PK PRIMARY KEY (COD_ID, MIN_ID),
    CONSTRAINT T_MINOR_DESC_CODE_ID_FK FOREIGN KEY (COD_ID) REFERENCES T_CODE_DESC(COD_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO T_MINOR_DESC VALUES ('C0001', 'PY', '정산', 1);
INSERT INTO T_MINOR_DESC VALUES ('C0001', 'PD', '진행중', 2);

INSERT INTO T_MINOR_DESC VALUES ('C0002', 'CD', '신용카드', 1);
INSERT INTO T_MINOR_DESC VALUES ('C0002', 'CH', '현금', 2);
INSERT INTO T_MINOR_DESC VALUES ('C0002', 'KP', '카카오페이', 3);

INSERT INTO T_MINOR_DESC VALUES ('C0003', 'M', '남성', 1);
INSERT INTO T_MINOR_DESC VALUES ('C0003', 'F', '여성', 2);

INSERT INTO T_MINOR_DESC VALUES ('C0004', 'F', '무료', 1);
INSERT INTO T_MINOR_DESC VALUES ('C0004', 'N', '일반', 2);
INSERT INTO T_MINOR_DESC VALUES ('C0004', 'V', 'VIP', 3);

SELECT * FROM T_CODE_DESC; 
SELECT * FROM T_MINOR_DESC; 

--------------------------------------------------------------------------------------------------------------------------------
-- 테이블 칼럼 삭제 
--------------------------------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS T_COLUMN_DESC;

--------------------------------------------------------------------------------------------------------------------------------
-- 테이블 칼럼 명세서
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_COLUMN_DESC
(
    COL_TBL_NAME	VARCHAR(30)  NOT NULL,
    COL_SEQ     	INT          NOT NULL,
    COL_ORD     	INT          NOT NULL,
    COL_ID      	VARCHAR(20)  NOT NULL,
    COL_NAME		VARCHAR(50)  NOT NULL,
    COL_TYPE       	VARCHAR(20)  NOT NULL,
    COL_WIDTH      	INT,
    COL_SUM    		VARCHAR(100),
    CONSTRAINT T_COLUMN_DESC_PK PRIMARY KEY (COL_TBL_NAME, COL_SEQ)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO T_COLUMN_DESC VALUES ('T_WORKOUTRecord', 1, 1, 'id', '운동번호', 'key', 80,  NULL);
INSERT INTO T_COLUMN_DESC VALUES ('T_WORKOUTRecord', 2, 2, 'wo_dt', '운동일', 'dat', 100, NULL);
INSERT INTO T_COLUMN_DESC VALUES ('T_WORKOUTRecord', 3, 3, 'title', '운동명', 'lst', 100, NULL);
INSERT INTO T_COLUMN_DESC VALUES ('T_WORKOUTRecord', 4, 4, 'target_reps', '반복횟수', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('T_WORKOUTRecord', 5, 5, 'target_sets', '세트수', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('T_WORKOUTRecord', 6, 6, 'count', '실행횟수', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('T_WORKOUTRecord', 7, 7, 'point', '획득포인트', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('T_WORKOUTRecord', 8, 8, 'description', '운동내역', 'str', 100, 'sum');

INSERT INTO T_COLUMN_DESC VALUES ('T_WORKOUTAchievement', 1, 1, 'id', '운동번호', 'key', 80,  NULL);
INSERT INTO T_COLUMN_DESC VALUES ('T_WORKOUTAchievement', 2, 2, 'wo_dt', '운동일', 'dat', 100, NULL);
INSERT INTO T_COLUMN_DESC VALUES ('T_WORKOUTAchievement', 3, 3, 'title', '운동명', 'lst', 100, NULL);
INSERT INTO T_COLUMN_DESC VALUES ('T_WORKOUTAchievement', 4, 4, 'target_reps', '반복횟수', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('T_WORKOUTAchievement', 5, 5, 'target_sets', '세트수', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('T_WORKOUTAchievement', 6, 6, 'count_p', '권장횟수', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('T_WORKOUTAchievement', 7, 7, 'count', '실행횟수', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('T_WORKOUTAchievement', 8, 8, 'count_s', '잔여횟수', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('T_WORKOUTAchievement', 9, 9, 'description', '운동내역', 'str', 100, 'sum');

SELECT *
FROM   T_COLUMN_DESC
WHERE  COL_TBL_NAME = 'T_WORKOUTRecord';

--------------------------------------------------------------------------------------------------------------------------------
-- 홈트 테이블 삭제   
--------------------------------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS T_WORKOUT_DETAIL;
DROP TABLE IF EXISTS T_WORKOUT_RECORD;
DROP TABLE IF EXISTS T_MEMBER;
DROP TABLE IF EXISTS T_WORKOUT;
DROP TABLE IF EXISTS T_ACHIEVEMENT;
DROP TABLE IF EXISTS T_REWARD;

--------------------------------------------------------------------------------------------------------------------------------
-- 회원 
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_MEMBER
(
    MEM_ID			VARCHAR(7)    NOT NULL,
    MEM_NAME       	VARCHAR(50)   NOT NULL,
    MEM_NICKNAME	VARCHAR(50)   NULL,
    MEM_PASSWORD   	VARCHAR(256)  NOT NULL,
    MEM_IMG        	VARCHAR(256)  NULL,
    MEM_SEX        	VARCHAR(5)    NULL,
    MEM_AGE        	INT           NOT NULL DEFAULT 0,
    MEM_POINT      	INT           NOT NULL DEFAULT 0,
    MEM_EXP_POINT  	INT           NOT NULL DEFAULT 0,
    MEM_LVL        	INT           NOT NULL DEFAULT 0,
    MEM_MEMBERSHIP 	VARCHAR(1)    NOT NULL,
    CONSTRAINT T_MEMBER_PK PRIMARY KEY (MEM_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- member_hash_password는 MySQL에 따로 함수 구현 필요
INSERT INTO T_MEMBER VALUES
('U000001', '백병구', '취', member_hash_password('U000001', '1234'), '/member/U000001.jpg','남', 52, 0, 0, 1, 'V');
INSERT INTO T_MEMBER VALUES
('U000002', '문정인', '고양이', member_hash_password('U000002', '1234'), '/member/u000002.jpg','여', 24, 0, 0, 1, 'F');
INSERT INTO T_MEMBER VALUES
('U000003', '문성윤', '소', member_hash_password('U000003', '1234'), '/member/u000003.jpg','남', 40, 0, 0, 1, 'N');
INSERT INTO T_MEMBER VALUES
('U000004', '김동건', '호랑이', member_hash_password('U000004', '1234'), '/member/u000004.jpg','남', 26, 0, 0, 1, 'N');

SELECT * FROM T_MEMBER;

--------------------------------------------------------------------------------------------------------------------------------
-- 운동
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_WORKOUT
(
    WKO_ID      VARCHAR(5)    NOT NULL,
    WKO_NAME    VARCHAR(50)   NOT NULL,
    WKO_IMG     VARCHAR(256)  NULL,
    WKO_DESC	VARCHAR(512)  NULL,
    WKO_GUIDE       VARCHAR(512)  NOT NULL,
    CONSTRAINT T_WORKOUT_PK PRIMARY KEY (WKO_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO T_WORKOUT VALUES
('W0001', '프랭크', '/T_WORKOUT/plank.png',
 '코어 근육(복근, 허리, 등)을 강화하는 운동으로, 몸을 널빤지처럼 일직선으로 유지하는 동작입니다.',
 '30초 동안 자세 유지하기');
INSERT INTO T_WORKOUT VALUES
('W0002', '스쿼트', '/T_WORKOUT/squat.png',
 '하체 근육(허벅지, 엉덩이)을 강화하는 운동으로, 무릎과 엉덩이를 굽히고 펴는 동작입니다.',
 '다리를 어깨 너비로 벌리고 앉았다 일어나기');
INSERT INTO T_WORKOUT VALUES
('W0003', '푸시업', '/T_WORKOUT/pushup.png',
 '상체 근육(가슴, 어깨, 삼두근)을 강화하는 운동으로, 팔을 굽히고 펴는 동작입니다.',
 '손은 어깨너비보다 약간 넓게, 손가락은 앞쪽으로 향하게 위치');
INSERT INTO T_WORKOUT VALUES
('W0004', '런지', '/T_WORKOUT/lunge.png',
 '하체 근육(허벅지, 엉덩이)을 강화하는 운동으로, 한쪽 다리를 앞으로 내딛고 무릎을 굽히는 동작입니다.',
 '좌우 각 10회씩 반복하기');

SELECT * FROM T_WORKOUT;
--------------------------------------------------------------------------------------------------------------------------------
-- 운동기록 
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_WORKOUT_RECORD 
(
    WKR_ID		VARCHAR(7)    NOT NULL,
    MEM_ID		VARCHAR(7)    NOT NULL,
    WKR_WO_DT	DATE          NOT NULL DEFAULT (CURRENT_DATE),
    WKR_DESC	VARCHAR(1024) NOT NULL,
    CONSTRAINT T_WORKOUT_RECORD_PK PRIMARY KEY (WKR_ID),
    CONSTRAINT T_WORKOUT_RECORD_MEM_ID_FK FOREIGN KEY (MEM_ID) REFERENCES T_MEMBER(MEM_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO T_WORKOUT_RECORD VALUES
('WR00001', 'U000001', '2026-03-01', '첫번째 운동');
INSERT INTO T_WORKOUT_RECORD VALUES
('WR00002', 'U000001', '2026-03-02', '두번째 운동');
INSERT INTO T_WORKOUT_RECORD VALUES
('WR00003', 'U000001', '2026-03-12', '첫번째 운동');
INSERT INTO T_WORKOUT_RECORD VALUES
('WR00004', 'U000002', '2026-03-02', '두번째 운동');

SELECT * FROM T_WORKOUT_RECORD;
--------------------------------------------------------------------------------------------------------------------------------
-- 운동상세
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_WORKOUT_DETAIL 
(
    WKR_ID VARCHAR(7) NOT NULL,
    WKO_ID VARCHAR(5) NOT NULL,
    WKD_TARGET_REPS       INT        NOT NULL DEFAULT 0,
    WKD_TARGET_SETS       INT        NOT NULL DEFAULT 0,
    WKD_COUNT             INT        NOT NULL DEFAULT 0,
    WKD_POINT             INT        NOT NULL DEFAULT 0,
    CONSTRAINT T_WORKOUT_DETAIL_PK PRIMARY KEY (WKR_ID, WKO_ID),
    CONSTRAINT T_WORKOUT_DETAIL_WKO_ID_FK FOREIGN KEY (WKO_ID) REFERENCES T_WORKOUT(WKO_ID),
    CONSTRAINT T_WORKOUT_DETAIL_WKR_ID_FK FOREIGN KEY (WKR_ID) REFERENCES T_WORKOUT_RECORD(WKR_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO T_WORKOUT_DETAIL VALUES
('WR00001', 'W0001', 15, 3, 45, 0);
INSERT INTO T_WORKOUT_DETAIL VALUES
('WR00001', 'W0002', 30, 2, 60, 0);
INSERT INTO T_WORKOUT_DETAIL VALUES
('WR00001', 'W0003', 20, 3, 55, 0);
INSERT INTO T_WORKOUT_DETAIL VALUES
('WR00002', 'W0001', 15, 3, 30, 0);
INSERT INTO T_WORKOUT_DETAIL VALUES
('WR00003', 'W0001', 15, 3, 45, 0);
INSERT INTO T_WORKOUT_DETAIL VALUES
('WR00003', 'W0002', 30, 2, 60, 0);

SELECT * FROM T_WORKOUT_DETAIL;

--------------------------------------------------------------------------------------------------------------------------------
-- 업적
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_ACHIEVEMENT
(
    ACH_ID      VARCHAR(5)    NOT NULL,
    ACH_NAME	VARCHAR(50)   NOT NULL,
    ACH_IMG     VARCHAR(256)  NULL,
    ACH_DESC	VARCHAR(1024) NULL,
    CONSTRAINT T_ACHIEVEMENT_PK PRIMARY KEY (ACH_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO T_ACHIEVEMENT VALUES
('W001', '첫 운동 완료', '/achievement/first.jpg','첫번째 운동을 완료.');
INSERT INTO T_ACHIEVEMENT VALUES
('W002', '주간 챔피언', '/achievement/weeklychamp.jpg','일주일 동안 5회 운동 완료.');
INSERT INTO T_ACHIEVEMENT VALUES
('W003', '완벽한 자세', '/achievement/perfectposture.jpg','자세 정확도 95% 이상 달성.');
INSERT INTO T_ACHIEVEMENT VALUES
('W004', '꾸준함의 달인', '/achievement/consistency.jpg','7일 연속 운동 완료.');
INSERT INTO T_ACHIEVEMENT VALUES
('W005', '100회 클럽', '/achievement/hundredclub.jpg','100회 운동 완료.');

SELECT * FROM T_ACHIEVEMENT;
--------------------------------------------------------------------------------------------------------------------------------
-- 보상
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_REWARD
(
    REW_ID   VARCHAR(5)    NOT NULL,
    REW_NAME VARCHAR(50)   NOT NULL,
    REW_IMG  VARCHAR(256)  NULL,
    REW_DESC VARCHAR(512)  NULL,
    CONSTRAINT T_REWARD_PK PRIMARY KEY (REW_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO T_REWARD VALUES
('R002', '맞춤 운동 프로그램', '/reward/custom_program.jpg','AI가 나만의 운동 프로그램을 생성해줍니다');
INSERT INTO T_REWARD VALUES
('R003', '홈트레이닝 용품 할인', '/reward/home_training_discount.jpg','홈트레이닝 용품을 할인된 가격에 구매하세요');
INSERT INTO T_REWARD VALUES
('R004', '영양 가이드북', '/reward/nutrition_guide.jpg','영양 가이드북을 제공합니다');
INSERT INTO T_REWARD VALUES
('R005', 'SNS 콘텐츠 제작권', '/reward/sns_content.jpg','SNS 콘텐츠를 제작할 수 있는 권한을 제공합니다');
INSERT INTO T_REWARD VALUES
('R006', '1:1 온라인 상담', '/reward/online_consultation.jpg','전문 트레이너와 30분 온라인 상담');

SELECT * FROM T_REWARD;

COMMIT;
