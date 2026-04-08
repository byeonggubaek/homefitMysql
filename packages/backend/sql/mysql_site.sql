-- Copyright : Copyright (c) 2026 by White Dog
-- Author    : 109 
-- History   : 2026-02-03 - 최초 작성 
-- Remark    : MySQL 용 SQL

-- START TRANSACTION;
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
    NAV_ID      VARCHAR(8) NOT NULL COMMENT '메뉴 아이디',
    NAV_NAME    VARCHAR(50) NOT NULL COMMENT '메뉴 이름',
    NAV_IMG     VARCHAR(256) NULL COMMENT '메뉴 이미지 경로',
    NAV_DESC	VARCHAR(512) NULL COMMENT '메뉴 설명',
    CONSTRAINT T_NAV_ITEM_PK PRIMARY KEY (NAV_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO T_NAV_ITEM VALUES
('NAV00001', '운동', '/menu/workout.jpg','운동을 측정하고 기록합니다.');
INSERT INTO T_NAV_ITEM VALUES
('NAV00002', '기록', '/menu/history.jpg','운동 성과를 확인합니다.');
INSERT INTO T_NAV_ITEM VALUES
('NAV00003', '보상', '/menu/reward.jpg','포인트, 업적, 순위를 확인하며 쇼핑몰에서 운동용품을 구입할 수 있습니다.');
INSERT INTO T_NAV_ITEM VALUES
('NAV00004', '내정보', '/menu/member.jpg','개인 정보를 관리합니다.');
-- INSERT INTO T_NAV_ITEM VALUES
-- ('NAV00005', '관리자', '/menu/system.png','사이트를 관리합니다.');

SELECT * FROM T_NAV_ITEM;
--------------------------------------------------------------------------------------------------------------------------------
-- 상세메뉴
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_NAV_SUB_ITEM
(
    NAV_ID		VARCHAR(8) NOT NULL COMMENT '',
    NAS_ID		VARCHAR(5) NOT NULL COMMENT '',
    NAS_NAME 	VARCHAR(50) NOT NULL COMMENT '',
    NAS_IMG   	VARCHAR(256) NULL COMMENT '',
    NAS_DESC	VARCHAR(512) NULL COMMENT '',
    NAS_PAGE  	VARCHAR(256) NOT NULL COMMENT '',
    NAS_HREF  	VARCHAR(256) NOT NULL COMMENT '',
    CONSTRAINT T_NAV_SUB_ITEM_PK PRIMARY KEY (NAV_ID, NAS_ID),
    CONSTRAINT T_NAV_SUB_ITEM_NAV_ID_FK
        FOREIGN KEY (NAV_ID) REFERENCES T_NAV_ITEM(NAV_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO T_NAV_SUB_ITEM VALUES
('NAV00001', 'S0001', '오늘의운동','/menu/dashboard.jpg', '프로그램에 따라 운동을 수행합니다.', 'WorkoutDashboard', '/workout/dashboard');
INSERT INTO T_NAV_SUB_ITEM VALUES
('NAV00002', 'S0001', '운동내역','/menu/state.jpg', '운동 내역을 확인합니다.', 'HistoryState', '/history/state');
-- INSERT INTO T_NAV_SUB_ITEM VALUES
-- ('NAV00002', 'S0002', '콘텐츠제작','/menu/content.jpg', '운동 내역으로 SNS 콘텐츠를 자동 생성합니다.', 'HistoryContent', '/history/content');
INSERT INTO T_NAV_SUB_ITEM VALUES
('NAV00003', 'S0001', '포인트','/menu/point.jpg', '운동 포인트를 확인합니다.', 'RewardPoint', '/reward/point');
INSERT INTO T_NAV_SUB_ITEM VALUES
('NAV00003', 'S0002', '업적','/menu/achievement.jpg', '운동 업적을 확인합니다.', 'RewardAchievement', '/reward/achievement');
INSERT INTO T_NAV_SUB_ITEM VALUES
('NAV00003', 'S0003', '순위','/menu/ranking.jpg', '운동 순위를 확인합니다.', 'RewardRanking', '/reward/ranking');
INSERT INTO T_NAV_SUB_ITEM VALUES
('NAV00003', 'S0004', '쇼핑몰','/menu/mall.jpg', '굿즈 또는 운동용품을 구매합니다.', 'RewardMall', '/reward/mall');
INSERT INTO T_NAV_SUB_ITEM VALUES
('NAV00004', 'S0001', '프로필','/menu/profile.jpg', '개인 정보를 관리합니다.', 'MemberProfile', '/member/profile/profile');
INSERT INTO T_NAV_SUB_ITEM VALUES
('NAV00004', 'S0002', '운동목표','/menu/plan.jpg', '운동 목표를 설정하고 관리합니다.', 'MemberPlan', '/member/plan');
INSERT INTO T_NAV_SUB_ITEM VALUES
('NAV00004', 'S0003', '운동보고서','/menu/workreport.jpg', '운동 보고서를 확인합니다.', 'MemberWorkReport', '/member/workreport');
INSERT INTO T_NAV_SUB_ITEM VALUES
('NAV00005', 'S0001', '조회','/menu/select.jpg', 'Backend 조회 service를 자동생성합니다.', 'SystemSelect', '/system/select');
INSERT INTO T_NAV_SUB_ITEM VALUES
('NAV00005', 'S0002', '생성','/menu/insert.jpg', 'Backend 생성 service를 자동생성합니다.', 'SystemInsert', '/system/insert');
INSERT INTO T_NAV_SUB_ITEM VALUES
('NAV00005', 'S0003', '수정','/menu/update.jpg', 'Backend 수정 service를 자동생성합니다.', 'SystemUpdate', '/system/update');
INSERT INTO T_NAV_SUB_ITEM VALUES
('NAV00005', 'S0004', '그래프','/menu/graph.jpg', 'Backend 그래프 service를 자동생성합니다.', 'SystemGraph', '/system/graph');

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
    COD_ID   VARCHAR(8) NOT NULL COMMENT '코드 ID',
    COD_NAME VARCHAR(100) NOT NULL COMMENT '코드 이름',
    CONSTRAINT T_CODE_DESC_PK PRIMARY KEY (COD_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO T_CODE_DESC VALUES ('COD00001', '지급상태');
INSERT INTO T_CODE_DESC VALUES ('COD00002', '지불방법');
INSERT INTO T_CODE_DESC VALUES ('COD00003', '성별');
INSERT INTO T_CODE_DESC VALUES ('COD00004', '운동상태');

SELECT * FROM T_CODE_DESC; 

CREATE TABLE T_MINOR_DESC
(
    COD_ID		VARCHAR(8) NOT NULL COMMENT '코드 ID',
    MIN_ID      VARCHAR(5) NOT NULL COMMENT '세부코드 이름',
    MIN_NAME    VARCHAR(100) NOT NULL COMMENT '세부코드 명',
    MIN_ORD     INT NOT NULL COMMENT '코드 순번',
    CONSTRAINT T_MINOR_DESC_PK PRIMARY KEY (COD_ID, MIN_ID),
    CONSTRAINT T_MINOR_DESC_CODE_ID_FK FOREIGN KEY (COD_ID) REFERENCES T_CODE_DESC(COD_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO T_MINOR_DESC VALUES ('COD00001', 'PY', '정산', 1);
INSERT INTO T_MINOR_DESC VALUES ('COD00001', 'PD', '진행중', 2);

INSERT INTO T_MINOR_DESC VALUES ('COD00002', 'CD', '신용카드', 1);
INSERT INTO T_MINOR_DESC VALUES ('COD00002', 'CH', '현금', 2);
INSERT INTO T_MINOR_DESC VALUES ('COD00002', 'KP', '카카오페이', 3);

INSERT INTO T_MINOR_DESC VALUES ('COD00003', 'M', '남성', 1);
INSERT INTO T_MINOR_DESC VALUES ('COD00003', 'F', '여성', 2);

INSERT INTO T_MINOR_DESC VALUES ('COD00004', 'N', '미완', 1);
INSERT INTO T_MINOR_DESC VALUES ('COD00004', 'C', '완료', 2);

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
    COL_TBL_NAME	VARCHAR(30)  NOT NULL COMMENT '대상 테이블',
    COL_SEQ     	INT          NOT NULL COMMENT '컬럼 순번',
    COL_ORD     	INT          NOT NULL COMMENT '화면 표시순번',
    COL_ID      	VARCHAR(20)  NOT NULL COMMENT '컬럼 코드',
    COL_NAME		VARCHAR(50)  NOT NULL COMMENT '컬럼 이름 (str,num,dat등)',
    COL_TYPE       	VARCHAR(20)  NOT NULL COMMENT '컬럼 유형',
    COL_WIDTH      	INT 		 NULL COMMENT '컬럼 너비'	,
    COL_SUM    		VARCHAR(100),
    CONSTRAINT T_COLUMN_DESC_PK PRIMARY KEY (COL_TBL_NAME, COL_SEQ)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO T_COLUMN_DESC VALUES ('WorkoutRecord', 1, 1, 'WOR_ID_VIEW', '운동번호', 'key', 80,  NULL);
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutRecord', 2, 2, 'WOR_DT', '운동일', 'dat', 100, NULL);
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutRecord', 3, 3, 'WOO_NAME', '운동명', 'lst', 100, NULL);
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutRecord', 4, 4, 'WOD_TARGET_REPS', '반복횟수/초', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutRecord', 5, 5, 'WOD_TARGET_SETS', '세트수', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutRecord', 6, 6, 'WOD_COUNT', '실행횟수/초', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutRecord', 7, 7, 'WOD_POINT', '획득포인트', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutRecord', 8, 8, 'WOR_DESC', '운동내역', 'str', 100, 'sum');

INSERT INTO T_COLUMN_DESC VALUES ('WorkoutAchievement', 1, 1, 'WO_DT', '운동일', 'dat', 80,  NULL);
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutAchievement', 2, 2, 'WOO_NAME', '운동명', 'lst', 100, NULL);
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutAchievement', 3, 3, 'PLAN_CNT', '계획횟수/초', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutAchievement', 4, 4, 'ACT_CNT', '실행횟수/초', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutAchievement', 5, 5, 'LEFT_CNT', '남은횟수/초', 'qty', 100, 'sum');

SELECT *
FROM   T_COLUMN_DESC
WHERE  COL_TBL_NAME = 'WorkoutRecord';
--------------------------------------------------------------------------------------------------------------------------------
-- 홈트 테이블 삭제   
--------------------------------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS T_AI_REPORT;
DROP TABLE IF EXISTS T_WORKOUT_DETAIL;
DROP TABLE IF EXISTS T_WORKOUT_RECORD;
DROP TABLE IF EXISTS T_INVOICE;
DROP TABLE IF EXISTS T_MEMBER_PLAN;
DROP TABLE IF EXISTS T_MEMBER_ACHIEVEMENT;
DROP TABLE IF EXISTS T_MEMBER;
DROP TABLE IF EXISTS T_WORKOUT;
DROP TABLE IF EXISTS T_ACHIEVEMENT;
DROP TABLE IF EXISTS T_REWARD;
DROP TABLE IF EXISTS T_MEMBERSHIP_BENEFIT;
DROP TABLE IF EXISTS T_MEMBERSHIP;
DROP TABLE IF EXISTS T_BENEFIT;
DROP TABLE IF EXISTS T_GOODS;
--------------------------------------------------------------------------------------------------------------------------------
-- 혜택
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_BENEFIT
(
    BEN_ID			INT AUTO_INCREMENT NOT NULL COMMENT '혜택 내부ID (자동증가)',
    BEN_ID_VIEW 	VARCHAR(8)		NOT NULL COMMENT '혜택 코드',
    BEN_NAME       	VARCHAR(50)		NOT NULL COMMENT '혜택 명칭',
    CONSTRAINT T_BENEFIT_PK PRIMARY KEY (BEN_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE T_BENEFIT ADD INDEX T_BENEFIT_BEN_ID_VIEW_IX (BEN_ID_VIEW);

INSERT INTO T_BENEFIT 
(BEN_ID_VIEW, BEN_NAME)
VALUES('BEN00001', '기본 운동 기록');
INSERT INTO T_BENEFIT 
(BEN_ID_VIEW, BEN_NAME)
VALUES('BEN00002', '통계 데이터 생성');
INSERT INTO T_BENEFIT 
(BEN_ID_VIEW, BEN_NAME)
VALUES('BEN00003', '포인트 2배 적립');
INSERT INTO T_BENEFIT 
(BEN_ID_VIEW, BEN_NAME)
VALUES('BEN00004', '월간 랭킹 계산');
INSERT INTO T_BENEFIT 
(BEN_ID_VIEW, BEN_NAME)
VALUES('BEN00005', '맞춤 운동 추천');
INSERT INTO T_BENEFIT 
(BEN_ID_VIEW, BEN_NAME)
VALUES('BEN00006', 'VIP + 프리미엄 전용 콘텐츠');
INSERT INTO T_BENEFIT 
(BEN_ID_VIEW, BEN_NAME)
VALUES('BEN00007', '광고 완전 제거');

SELECT	*
FROM	T_BENEFIT;
--------------------------------------------------------------------------------------------------------------------------------
-- 회원등급
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_MEMBERSHIP
(
    MES_ID		INT AUTO_INCREMENT NOT NULL COMMENT '맴버쉽 프랜 내부ID (자동증가)',
    MES_ID_VIEW VARCHAR(8)		NOT NULL COMMENT '맴버쉽 프랜 코드',
    MES_NAME    VARCHAR(50)		NOT NULL COMMENT '맴버쉽 프랜 명칭',
    MES_FEE		INT 			NOT NULL DEFAULT 0 COMMENT '맴버쉽 프랜 가격',
    CONSTRAINT T_MEMBERSHIP_PK PRIMARY KEY (MES_ID)
);
ALTER TABLE T_MEMBERSHIP ADD INDEX T_MEMBERSHIP_MES_ID_VIEW_IX (MES_ID_VIEW);

INSERT INTO T_MEMBERSHIP 
(MES_ID_VIEW, MES_NAME, MES_FEE)
VALUES('MES00001', 'FREE', 0);
INSERT INTO T_MEMBERSHIP 
(MES_ID_VIEW, MES_NAME, MES_FEE)
VALUES('MES00002', 'PREMINIUM', 9900);
INSERT INTO T_MEMBERSHIP 
(MES_ID_VIEW, MES_NAME, MES_FEE)
VALUES('MES00003', 'VIP', 20000);

SELECT	*
FROM	T_MEMBERSHIP;
--------------------------------------------------------------------------------------------------------------------------------
-- 회원등급별 혜택 
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_MEMBERSHIP_BENEFIT
(
    MES_ID      INT		NOT NULL	COMMENT '회원등급 코드',
    BEN_ID      INT     NOT NULL	COMMENT '혜택 코드',
    CONSTRAINT T_MEMBERSHIP_BENEFIT_PK PRIMARY KEY (MES_ID, BEN_ID),
    CONSTRAINT T_MEMBERSHIP_MSP_ID_FK FOREIGN KEY (MES_ID) REFERENCES T_MEMBERSHIP(MES_ID),
    CONSTRAINT T_MEMBERSHIP_BEN_ID_FK FOREIGN KEY (BEN_ID) REFERENCES T_BENEFIT(BEN_ID)    
);

INSERT INTO T_MEMBERSHIP_BENEFIT 
VALUES(1, 1);
INSERT INTO T_MEMBERSHIP_BENEFIT 
VALUES(1, 2);
INSERT INTO T_MEMBERSHIP_BENEFIT 
VALUES(2, 1);
INSERT INTO T_MEMBERSHIP_BENEFIT 
VALUES(2, 2);
INSERT INTO T_MEMBERSHIP_BENEFIT 
VALUES(2, 3);
INSERT INTO T_MEMBERSHIP_BENEFIT 
VALUES(2, 4);
INSERT INTO T_MEMBERSHIP_BENEFIT 
VALUES(2, 5);
INSERT INTO T_MEMBERSHIP_BENEFIT 
VALUES(3, 1);
INSERT INTO T_MEMBERSHIP_BENEFIT 
VALUES(3, 2);
INSERT INTO T_MEMBERSHIP_BENEFIT 
VALUES(3, 3);
INSERT INTO T_MEMBERSHIP_BENEFIT 
VALUES(3, 4);
INSERT INTO T_MEMBERSHIP_BENEFIT 
VALUES(3, 5);
INSERT INTO T_MEMBERSHIP_BENEFIT 
VALUES(3, 6);
INSERT INTO T_MEMBERSHIP_BENEFIT 
VALUES(3, 7);
SELECT	*
FROM	T_MEMBERSHIP_BENEFIT;
-------------------------------------------------------------------------------------------------------------------------------
-- 회원 
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_MEMBER
(
    MEM_ID			INT AUTO_INCREMENT NOT NULL COMMENT '회원내부ID (자동증가)',
    MEM_ID_VIEW		VARCHAR(50)   NOT NULL COMMENT '회원 ID (이메일 또는 사용자ID)',
    MEM_NAME       	VARCHAR(50)   NOT NULL COMMENT '회원 이름',
    MEM_NICKNAME	VARCHAR(50)   NULL COMMENT '닉네임',
    MEM_PASSWORD   	VARCHAR(256)  NOT NULL COMMENT '패스워드 해시값',
    MEM_IMG        	VARCHAR(256)  NULL COMMENT '회원 이미지 경로',
    MEM_PNUMBER		VARCHAR(64)   NULL COMMENT '전화번호',
    MEM_EMAIL		VARCHAR(512)  NULL COMMENT '이메일',
    MEM_SEX        	VARCHAR(5)    NOT NULL COMMENT '성별 코드 (T_MINOR_DESC : CD00003 참조)',
    MEM_AGE        	INT           NOT NULL DEFAULT 0 COMMENT '나이',
    MEM_POINT      	INT           NOT NULL DEFAULT 0 COMMENT '현재 포인트',
    MEM_EXP_POINT	INT 		  NOT NULL DEFAULT 0 COMMENT '누적 경험치 (4500점=1레벨)',
    MEM_LVL        	INT           NOT NULL DEFAULT 0 COMMENT '회원 레벨',
    MEM_STREAK		INT           NOT NULL DEFAULT 0 COMMENT '연속목표 당성일',
    MES_ID 			INT	  		  NOT NULL DEFAULT 1 COMMENT '회원 등급 코드 (T_MEMBERSHIP 참조)',
    CONSTRAINT T_MEMBER_PK PRIMARY KEY (MEM_ID),
	CONSTRAINT T_MEMBER_MES_ID_FK FOREIGN KEY (MES_ID) REFERENCES T_MEMBERSHIP(MES_ID)      
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE T_MEMBER ADD INDEX T_MEMBER_MEM_ID_VIEW_IX (MEM_ID_VIEW);

-- member_hash_password는 MySQL에 따로 함수 구현 필요
INSERT INTO T_MEMBER 
(MEM_ID_VIEW, MEM_NAME, MEM_NICKNAME, MEM_PASSWORD, MEM_IMG, MEM_PNUMBER, MEM_EMAIL, MEM_SEX, MEM_AGE, MEM_POINT, MEM_EXP_POINT, MEM_LVL,  MEM_STREAK, MES_ID)
VALUES
('oranjes@naver.com', '백병구', '쥐', member_hash_password('oranjes@naver.com', '1234'), '/member/U000001.jpg','010-5555-5555','ZZ@NAVER.COM','M', 52, 400, 10000, 2, 2, 3);
INSERT INTO T_MEMBER 
(MEM_ID_VIEW, MEM_NAME, MEM_NICKNAME, MEM_PASSWORD, MEM_IMG, MEM_PNUMBER, MEM_EMAIL, MEM_SEX, MEM_AGE, MEM_POINT, MEM_EXP_POINT, MEM_LVL,  MEM_STREAK, MES_ID)
VALUES
('moon@naver.com', '문정인', '고양이', member_hash_password('moon@naver.com', '1234'), '/member/U000002.jpg','010-5555-5555','ZZ@NAVER.COM','F', 24, 1050, 2050, 1, 2, 2);
INSERT INTO T_MEMBER 
(MEM_ID_VIEW, MEM_NAME, MEM_NICKNAME, MEM_PASSWORD, MEM_IMG, MEM_PNUMBER, MEM_EMAIL, MEM_SEX, MEM_AGE, MEM_POINT, MEM_EXP_POINT, MEM_LVL,  MEM_STREAK, MES_ID)
VALUES
('sung@naver.com', '문성윤', '호랑이', member_hash_password('sung@naver.com', '1234'), '/member/U000003.png','010-5555-5555','ZZ@NAVER.COM','M', 40, 1200, 0, 1, 2, 1);
INSERT INTO T_MEMBER 
(MEM_ID_VIEW, MEM_NAME, MEM_NICKNAME, MEM_PASSWORD, MEM_IMG, MEM_PNUMBER, MEM_EMAIL, MEM_SEX, MEM_AGE, MEM_POINT, MEM_EXP_POINT, MEM_LVL,  MEM_STREAK, MES_ID)
VALUES
('dong@naver.com', '김동건', '사자', member_hash_password('dong@naver.com', '1234'), '/member/U000004.webp','010-5555-5555','ZZ@NAVER.COM','M', 4200, 0, 0, 1, 2, 1);
SELECT * FROM T_MEMBER;
--------------------------------------------------------------------------------------------------------------------------------
-- 운동
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_WORKOUT
(
    WOO_ID      	INT AUTO_INCREMENT NOT NULL COMMENT '운동 내부ID (자동증가)',
    WOO_ID_VIEW     VARCHAR(8)    	NOT NULL COMMENT '운동 ID',
    WOO_NAME    	VARCHAR(50)   	NOT NULL COMMENT '운동 이름',
    WOO_IMG     	VARCHAR(256)  	NULL COMMENT '운동 이미지 경로',
    WOO_DESC		VARCHAR(512)  	NULL COMMENT '운동 설명',
    WOO_GUIDE   	VARCHAR(512)	NULL COMMENT '운동 가이드',
    WOO_UNIT		VARCHAR(10)     NOT NULL COMMENT '권장 단위',
    WOO_TARGET_REPS	INT        		NOT NULL DEFAULT 0 COMMENT '권장 수 기본값',
    WOO_TARGET_SETS	INT        		NOT NULL DEFAULT 0 COMMENT '권장 세트수 기본값',    
    WOO_TYPE 		VARCHAR(20)		NOT NULL COMMENT '',
    CONSTRAINT T_WORKOUT_PK PRIMARY KEY (WOO_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE T_WORKOUT ADD INDEX T_WORKOUT_WOO_ID_VIEW_IX (WOO_ID_VIEW);

INSERT INTO T_WORKOUT 
(WOO_ID_VIEW, WOO_NAME, WOO_IMG, WOO_DESC, WOO_GUIDE, WOO_UNIT, WOO_TARGET_REPS, WOO_TARGET_SETS, WOO_TYPE)
VALUES
('WOO00001', '프랭크', '/workout/plank.png',
 '코어 근육(복근, 허리, 등)을 강화하는 운동으로, 몸을 널빤지처럼 일직선으로 유지하는 동작입니다.',
 '30초 동안 자세 유지하기', '초', 30, 2, '코어');
INSERT INTO T_WORKOUT 
(WOO_ID_VIEW, WOO_NAME, WOO_IMG, WOO_DESC, WOO_GUIDE, WOO_UNIT, WOO_TARGET_REPS, WOO_TARGET_SETS, WOO_TYPE)
VALUES
('WOO00002', '스쿼트', '/workout/squat.png',
 '하체 근육(허벅지, 엉덩이)을 강화하는 운동으로, 무릎과 엉덩이를 굽히고 펴는 동작입니다.',
 '다리를 어깨 너비로 벌리고 앉았다 일어나기', '회', 20, 2, '하체');
INSERT INTO T_WORKOUT 
(WOO_ID_VIEW, WOO_NAME, WOO_IMG, WOO_DESC, WOO_GUIDE, WOO_UNIT, WOO_TARGET_REPS, WOO_TARGET_SETS, WOO_TYPE)
VALUES
('WOO00003', '푸시업', '/workout/pushup.png',
 '상체 근육(가슴, 어깨, 삼두근)을 강화하는 운동으로, 팔을 굽히고 펴는 동작입니다.',
 '손은 어깨너비보다 약간 넓게, 손가락은 앞쪽으로 향하게 위치', '회', 15, 3, '상체');
INSERT INTO T_WORKOUT 
(WOO_ID_VIEW, WOO_NAME, WOO_IMG, WOO_DESC, WOO_GUIDE, WOO_UNIT, WOO_TARGET_REPS, WOO_TARGET_SETS, WOO_TYPE)
VALUES
('WOO00004', '런지', '/workout/lunge.png',
 '하체 근육(허벅지, 엉덩이)을 강화하는 운동으로, 한쪽 다리를 앞으로 내딛고 무릎을 굽히는 동작입니다.',
 '좌우 각 권장 횟수만큼 반복하기', '회', 20, 2, '하체');

SELECT * FROM T_WORKOUT;

--------------------------------------------------------------------------------------------------------------------------------
-- 운동 계획
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_MEMBER_PLAN (
    MEP_ID          INT AUTO_INCREMENT NOT NULL COMMENT '계획 고유번호',
    MEM_ID          INT NOT NULL COMMENT '회원 내부 ID',
    WOO_ID          INT NOT NULL COMMENT '운동 ID (T_WORKOUT 참조)',
    MEP_DATE        DATE NOT NULL COMMENT '계획된 날짜',
    MEP_TARGET_REPS INT NOT NULL DEFAULT 0 COMMENT '목표 횟수',
    MEP_TARGET_SETS INT NOT NULL DEFAULT 0 COMMENT '목표 세트수',
    MEP_UNIT        VARCHAR(10) NOT NULL COMMENT '단위 (회, 초, 세트 등)',
    MEP_ACHIEVED    CHAR(1) DEFAULT 'N' COMMENT '달성 여부 (Y/N)',
    MEP_DT          DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
    CONSTRAINT T_MEMBER_PLAN_PK PRIMARY KEY (MEP_ID),
    CONSTRAINT T_MEMBER_PLAN_MEM_FK FOREIGN KEY (MEM_ID) REFERENCES T_MEMBER(MEM_ID),
    CONSTRAINT T_MEMBER_PLAN_WOO_FK FOREIGN KEY (WOO_ID) REFERENCES T_WORKOUT(WOO_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 테스트 데이터
INSERT INTO T_MEMBER_PLAN (MEM_ID, WOO_ID, MEP_DATE, MEP_TARGET_REPS, MEP_TARGET_SETS, MEP_UNIT, MEP_ACHIEVED, MEP_DT)
VALUES (2, 1, '2026-04-03', 30, 3, '초', 'C', sysdate());
INSERT INTO T_MEMBER_PLAN (MEM_ID, WOO_ID, MEP_DATE, MEP_TARGET_REPS, MEP_TARGET_SETS, MEP_UNIT, MEP_ACHIEVED, MEP_DT)
VALUES (2, 2, '2026-04-03', 20, 2, '회', 'C', sysdate());
INSERT INTO T_MEMBER_PLAN (MEM_ID, WOO_ID, MEP_DATE, MEP_TARGET_REPS, MEP_TARGET_SETS, MEP_UNIT, MEP_ACHIEVED, MEP_DT)
VALUES (2, 3, '2026-04-03', 10, 3, '회', 'C', sysdate());

INSERT INTO T_MEMBER_PLAN (MEM_ID, WOO_ID, MEP_DATE, MEP_TARGET_REPS, MEP_TARGET_SETS, MEP_UNIT, MEP_ACHIEVED, MEP_DT)
VALUES (2, 1, '2026-04-05', 30, 3, '회', 'C', sysdate());

INSERT INTO T_MEMBER_PLAN (MEM_ID, WOO_ID, MEP_DATE, MEP_TARGET_REPS, MEP_TARGET_SETS, MEP_UNIT, MEP_ACHIEVED, MEP_DT)
VALUES (2, 1, '2026-04-07', 60, 2, '회', 'C', sysdate());
INSERT INTO T_MEMBER_PLAN (MEM_ID, WOO_ID, MEP_DATE, MEP_TARGET_REPS, MEP_TARGET_SETS, MEP_UNIT, MEP_ACHIEVED, MEP_DT)
VALUES (2, 2, '2026-04-07', 20, 3, '회', 'C', sysdate());

SELECT	*
FROM	T_MEMBER_PLAN;
--------------------------------------------------------------------------------------------------------------------------------
-- 운동기록 
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_WORKOUT_RECORD 
(
	WOR_ID 		INT AUTO_INCREMENT NOT NULL COMMENT '운동기록 내부ID (자동증가)',
    WOR_ID_VIEW	VARCHAR(8)    NOT NULL COMMENT '운동기록 ID',
    MEM_ID		INT		      NOT NULL COMMENT '회원 ID',
    WOR_DT		DATE          NOT NULL DEFAULT (CURRENT_DATE)  COMMENT '운동일',
    WOR_DESC	VARCHAR(512)  NULL COMMENT '운동 설명',
    WOR_STATUS  VARCHAR(2)	  NOT NULL DEFAULT 'N' COMMENT '운동 상태 (T_MINOR_DESC : CD00004 참조)',
    CONSTRAINT T_WORKOUT_RECORD_PK PRIMARY KEY (WOR_ID),
    CONSTRAINT T_WORKOUT_RECORD_MEM_ID_FK FOREIGN KEY (MEM_ID) REFERENCES T_MEMBER(MEM_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE T_WORKOUT_RECORD ADD INDEX T_WORKOUT_RECORD_WOR_ID_VIEW_IX (WOR_ID_VIEW);

INSERT INTO T_WORKOUT_RECORD 
(WOR_ID_VIEW, MEM_ID, WOR_DT, WOR_DESC, WOR_STATUS)
VALUES
('WOR00001', 1, '2026-04-03', '첫번째 운동', 'C');
INSERT INTO T_WORKOUT_RECORD 
(WOR_ID_VIEW, MEM_ID, WOR_DT, WOR_DESC, WOR_STATUS)
VALUES
('WOR00002', 1, '2026-04-07', '두번째 운동', 'C');
INSERT INTO T_WORKOUT_RECORD 
(WOR_ID_VIEW, MEM_ID, WOR_DT, WOR_DESC, WOR_STATUS)
VALUES
('WOR00003', 2, '2026-04-05', '첫번째 운동', 'C');
INSERT INTO T_WORKOUT_RECORD 
(WOR_ID_VIEW, MEM_ID, WOR_DT, WOR_DESC, WOR_STATUS)
VALUES
('WOR00004', 2, '2026-04-06', '두번째 운동', 'C');
INSERT INTO T_WORKOUT_RECORD 
(WOR_ID_VIEW, MEM_ID, WOR_DT, WOR_DESC, WOR_STATUS)
VALUES
('WOR00005', 3, '2026-04-03', '첫번째 운동', 'C');
INSERT INTO T_WORKOUT_RECORD 
(WOR_ID_VIEW, MEM_ID, WOR_DT, WOR_DESC, WOR_STATUS)
VALUES
('WOR00006', 4, '2026-04-05', '첫번째 운동', 'C');

SELECT * FROM T_WORKOUT_RECORD;
--------------------------------------------------------------------------------------------------------------------------------
-- 운동상세
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_WORKOUT_DETAIL 
(
    WOR_ID 				INT				NOT NULL COMMENT '운동기록 ID',
    WOO_ID 				INT				NOT NULL COMMENT '운동 ID',
    WOD_GUIDE   		VARCHAR(512)	NULL COMMENT '운동 가이드',
    WOD_TARGET_REPS     INT        		NOT NULL DEFAULT 0 COMMENT '권장 횟수',
    WOD_TARGET_SETS     INT        		NOT NULL DEFAULT 0 COMMENT '권장 세트수',
    WOD_COUNT           INT        		NOT NULL DEFAULT 0 COMMENT '실제 실행 횟수',
    WOD_POINT           INT        		NOT NULL DEFAULT 0 COMMENT '획득 포인트',
	WOD_ACCURACY    	INT      		NOT NULL DEFAULT 0 COMMENT '운동 정확도',
    WOD_TIME			INT 			NOT NULL DEFAULT 0 COMMENT '운동시간(분)',
    CONSTRAINT T_WORKOUT_DETAIL_PK PRIMARY KEY (WOR_ID, WOO_ID), 
    CONSTRAINT T_WORKOUT_DETAIL_WOR_ID_FK FOREIGN KEY (WOR_ID) REFERENCES T_WORKOUT_RECORD(WOR_ID),
    CONSTRAINT T_WORKOUT_DETAIL_WOO_ID_FK FOREIGN KEY (WOO_ID) REFERENCES T_WORKOUT(WOO_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO T_WORKOUT_DETAIL VALUES
(1, 1, '', 30, 3, 45, 450, 95, 20);
INSERT INTO T_WORKOUT_DETAIL VALUES
(1, 2, '', 30, 2, 60, 600, 92, 20);
INSERT INTO T_WORKOUT_DETAIL VALUES
(1, 3, '', 20, 3, 55, 0, 0, 0);

INSERT INTO T_WORKOUT_DETAIL VALUES
(2, 1, '', 15, 3, 30, 300, 88, 10);

INSERT INTO T_WORKOUT_DETAIL VALUES
(3, 1, '', 15, 3, 45, 0, 0, 0);
INSERT INTO T_WORKOUT_DETAIL VALUES
(3, 2, '', 30, 2, 60, 0, 0, 0);

INSERT INTO T_WORKOUT_DETAIL VALUES
(4, 1, '', 15, 3, 45, 450, 95, 10);
INSERT INTO T_WORKOUT_DETAIL VALUES
(4, 2, '', 30, 2, 60, 600, 92, 20);
INSERT INTO T_WORKOUT_DETAIL VALUES
(4, 3, '', 20, 3, 55, 400, 80, 30);


INSERT INTO T_WORKOUT_DETAIL VALUES
(5, 1, '', 30, 3, 45, 450, 95, 20);
INSERT INTO T_WORKOUT_DETAIL VALUES
(5, 2, '', 30, 2, 60, 600, 92, 20);

INSERT INTO T_WORKOUT_DETAIL VALUES
(6, 1, '', 30, 3, 45, 1450, 95, 20);
INSERT INTO T_WORKOUT_DETAIL VALUES
(6, 2, '', 30, 2, 60, 600, 92, 20);
INSERT INTO T_WORKOUT_DETAIL VALUES
(6, 3, '', 20, 3, 55, 0, 0, 0);

SELECT * FROM T_WORKOUT_DETAIL;
--------------------------------------------------------------------------------------------------------------------------------
-- 업적
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_ACHIEVEMENT
(
	ACH_ID 		INT AUTO_INCREMENT NOT NULL COMMENT '업적 내부ID (자동증가)',
    ACH_ID_VIEW VARCHAR(8)    NOT NULL COMMENT '업적 ID',
    ACH_NAME	VARCHAR(50)   NOT NULL COMMENT '업적 명',
    ACH_IMG     VARCHAR(256)  NULL COMMENT '업적 이미지 경로',
    ACH_DESC	VARCHAR(512)  NULL COMMENT '업적 설명',
    ACH_REWARD_POINT INT DEFAULT 100 COMMENT '업적 보상 포인트',
    CONSTRAINT T_ACHIEVEMENT_PK PRIMARY KEY (ACH_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE T_ACHIEVEMENT ADD INDEX T_ACHIEVEMENT_ACH_ID_VIEW_IX (ACH_ID_VIEW);

INSERT INTO T_ACHIEVEMENT 
(ACH_ID_VIEW, ACH_NAME, ACH_IMG, ACH_DESC,ACH_REWARD_POINT)
VALUES
('ACH00001', '첫 운동 완료', '/achievement/first.jpg','첫번째 운동을 완료.', 100);
INSERT INTO T_ACHIEVEMENT 
(ACH_ID_VIEW, ACH_NAME, ACH_IMG, ACH_DESC,ACH_REWARD_POINT)
VALUES
('ACH00002', '주간 챔피언', '/achievement/weeklychamp.jpg','일주일 동안 5회 운동 완료.', 300);
INSERT INTO T_ACHIEVEMENT 
(ACH_ID_VIEW, ACH_NAME, ACH_IMG, ACH_DESC,ACH_REWARD_POINT)
VALUES
('ACH00003', '완벽한 자세', '/achievement/perfectposture.jpg','자세 정확도 95% 이상 달성.', 500);
INSERT INTO T_ACHIEVEMENT 
(ACH_ID_VIEW, ACH_NAME, ACH_IMG, ACH_DESC,ACH_REWARD_POINT)
VALUES
('ACH00004', '꾸준함의 달인', '/achievement/consistency.jpg','7일 연속 운동 완료.', 400);
INSERT INTO T_ACHIEVEMENT 
(ACH_ID_VIEW, ACH_NAME, ACH_IMG, ACH_DESC,ACH_REWARD_POINT)
VALUES
('ACH00005', '100회 클럽', '/achievement/hundredclub.jpg','100회 운동 완료.', 1000);

SELECT * FROM T_ACHIEVEMENT;
--------------------------------------------------------------------------------------------------------------------------------
-- 보상
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_MEMBER_ACHIEVEMENT (
    MEM_ID          INT NOT NULL COMMENT '회원 내부 ID',
    ACH_ID          INT NOT NULL COMMENT '업적 내부 ID',
    PRG_VAL         INT DEFAULT 0 COMMENT '현재 진행 값',
    PRG_PCT         INT DEFAULT 0 COMMENT '진행 퍼센트',
    CMP_YN          CHAR(1) DEFAULT 'N' COMMENT '달성 여부 (Y/N)',
    CMP_DT          DATETIME NULL COMMENT '달성 일자',
    PRIMARY KEY (MEM_ID, ACH_ID),
    FOREIGN KEY (MEM_ID) REFERENCES T_MEMBER(MEM_ID),
    FOREIGN KEY (ACH_ID) REFERENCES T_ACHIEVEMENT(ACH_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- [시연용 데이터 삽입] 3번 유저(sung@naver.com) 기준
INSERT INTO T_MEMBER_ACHIEVEMENT (MEM_ID, ACH_ID, PRG_VAL, PRG_PCT, CMP_YN, CMP_DT) VALUES
(2, 1, 1, 100, 'Y', '2026-04-05 10:00:00'), -- 완료
(2, 3, 1, 100, 'Y', '2026-04-07 14:00:00'), -- 완료
(2, 2, 3, 60, 'N', NULL),                -- 진행 중
(2, 4, 2, 28, 'N', NULL);                -- 진행 중

SELECT	*
FROM	T_MEMBER_ACHIEVEMENT;
--------------------------------------------------------------------------------------------------------------------------------
-- 보상
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_REWARD
(
	REW_ID	INT AUTO_INCREMENT NOT NULL COMMENT '보상 내부ID (자동증가)',
    REW_ID_VIEW   VARCHAR(8)    NOT NULL COMMENT '보상 ID',
    REW_NAME VARCHAR(50)   NOT NULL COMMENT '보상 명',
    REW_IMG  VARCHAR(256)  NULL COMMENT '보상 이미지 경로',
    REW_DESC VARCHAR(512)  NULL COMMENT '보상 설명',
    CONSTRAINT T_REWARD_PK PRIMARY KEY (REW_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE T_REWARD ADD INDEX T_REWARD_REW_ID_VIEW_IX (REW_ID_VIEW);

INSERT INTO T_REWARD 
(REW_ID_VIEW, REW_NAME, REW_IMG, REW_DESC)
VALUES
('REW00001', '맞춤 운동 프로그램', '/reward/custom_program.jpg','AI가 나만의 운동 프로그램을 생성해줍니다');
INSERT INTO T_REWARD 
(REW_ID_VIEW, REW_NAME, REW_IMG, REW_DESC)
VALUES
('REW00002', '홈트레이닝 용품 할인', '/reward/home_training_discount.jpg','홈트레이닝 용품을 할인된 가격에 구매하세요');
INSERT INTO T_REWARD 
(REW_ID_VIEW, REW_NAME, REW_IMG, REW_DESC)
VALUES
('REW00003', '영양 가이드북', '/reward/nutrition_guide.jpg','영양 가이드북을 제공합니다');
INSERT INTO T_REWARD 
(REW_ID_VIEW, REW_NAME, REW_IMG, REW_DESC)
VALUES
('REW00004', 'SNS 콘텐츠 제작권', '/reward/sns_content.jpg','SNS 콘텐츠를 제작할 수 있는 권한을 제공합니다');
INSERT INTO T_REWARD 
(REW_ID_VIEW, REW_NAME, REW_IMG, REW_DESC)
VALUES
('REW00005', '1:1 온라인 상담', '/reward/online_consultation.jpg','전문 트레이너와 30분 온라인 상담');

SELECT * FROM T_REWARD;
--------------------------------------------------------------------------------------------------------------------------------
-- 매출 
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_INVOICE
(
	INV_ID	INT AUTO_INCREMENT NOT NULL COMMENT '보상 내부ID (자동증가)',
    INV_ID_VIEW 	VARCHAR(8)	NOT NULL COMMENT '매출번호',
    INV_DT			DATE        NOT NULL DEFAULT (CURRENT_DATE)  COMMENT '운동일',
    MEM_ID			INT		    NOT NULL COMMENT '회원번호',
	INV_TOT_AMT		INT 		DEFAULT 0 COMMENT '결제 총액',
    INV_USED_POINT	INT 		DEFAULT 0 COMMENT '사용 포인트',
    CONSTRAINT T_INVOICE_PK PRIMARY KEY (INV_ID) 
);
ALTER TABLE T_INVOICE ADD INDEX T_INVOICE_INV_ID_VIEW_IX (INV_ID_VIEW);

INSERT INTO T_INVOICE 
(INV_ID_VIEW, INV_DT, MEM_ID, INV_TOT_AMT, INV_USED_POINT)
VALUES
('INV00001', '2026-04-05', 1,12000,1000);
INSERT INTO T_INVOICE 
(INV_ID_VIEW, INV_DT, MEM_ID, INV_TOT_AMT, INV_USED_POINT)
VALUES
('INV00002', '2026-04-06', 1,14000,0);
INSERT INTO T_INVOICE 
(INV_ID_VIEW, INV_DT, MEM_ID, INV_TOT_AMT, INV_USED_POINT)
VALUES
('INV00003', '2026-04-07', 2,13000,1000);

SELECT  *
FROM    T_INVOICE;
--------------------------------------------------------------------------------------------------------------------------------
-- 상품 
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_GOODS
(
	GOD_ID	INT AUTO_INCREMENT NOT NULL COMMENT '보상 내부ID (자동증가)',
    GOD_ID_VIEW VARCHAR(8)	NOT NULL COMMENT '상품 ID',
    GOD_NAME	VARCHAR(50)   NOT NULL COMMENT '상품 명',
    GOD_IMG     VARCHAR(256)  NULL COMMENT '상품 이미지 경로',
    GOD_DESC	VARCHAR(512)  NULL COMMENT '상품 설명',
    GOD_PRICE	INT 		NOT NULL DEFAULT 0 COMMENT '상품 가격',
    GOD_DCRATE  INT 		NOT NULL DEFAULT 0 COMMENT '상품 할인율',
    CONSTRAINT T_GOODS_PK PRIMARY KEY (GOD_ID)
);
ALTER TABLE T_GOODS ADD INDEX T_GOODS_GOD_ID_VIEW_IX (GOD_ID_VIEW);

INSERT INTO T_GOODS 
(GOD_ID_VIEW, GOD_NAME, GOD_IMG, GOD_DESC, GOD_PRICE, GOD_DCRATE)
VALUES
('GOD00001', '운동 매트', '/mallimg/yoga-mat.jpg','AI가 나만의 운동 프로그램을 생성해줍니다', 10000, 10);
INSERT INTO T_GOODS 
(GOD_ID_VIEW, GOD_NAME, GOD_IMG, GOD_DESC, GOD_PRICE, GOD_DCRATE)
VALUES
('GOD00002', '덤벨 세트', '/mallimg/dumbbell-set.jpg','홈트레이닝 용품을 할인된 가격에 구매하세요', 50000, 20);
INSERT INTO T_GOODS 
(GOD_ID_VIEW, GOD_NAME, GOD_IMG, GOD_DESC, GOD_PRICE, GOD_DCRATE)
VALUES
('GOD00003', '저항 밴드', '/mallimg/resistance-band.jpg','영양 가이드북을 제공합니다', 20000, 15);
INSERT INTO T_GOODS 
(GOD_ID_VIEW, GOD_NAME, GOD_IMG, GOD_DESC, GOD_PRICE, GOD_DCRATE)
VALUES
('GOD00004', '스포츠 물병', '/mallimg/water-bottle.jpg','스포츠용 물병', 9000, 10);
INSERT INTO T_GOODS 
(GOD_ID_VIEW, GOD_NAME, GOD_IMG, GOD_DESC, GOD_PRICE, GOD_DCRATE)
VALUES
('GOD00005', '폼롤러', '/mallimg/foam-roller.jpg','폼롤러', 22000, 25);
INSERT INTO T_GOODS 
(GOD_ID_VIEW, GOD_NAME, GOD_IMG, GOD_DESC, GOD_PRICE, GOD_DCRATE)
VALUES
('GOD00006', '케틀벨', '/mallimg/kettlebell.jpg','케틀벨', 47000, 20);
INSERT INTO T_GOODS 
(GOD_ID_VIEW, GOD_NAME, GOD_IMG, GOD_DESC, GOD_PRICE, GOD_DCRATE)
VALUES
('GOD00007', '줄넘기', '/mallimg/jump-rope.jpg','줄넘기', 11000, 15);
INSERT INTO T_GOODS 
(GOD_ID_VIEW, GOD_NAME, GOD_IMG, GOD_DESC, GOD_PRICE, GOD_DCRATE)
VALUES
('GOD00008', '운동 장갑', '/mallimg/gym-gloves.jpg','운동 장갑', 17000, 20);
INSERT INTO T_GOODS 
(GOD_ID_VIEW, GOD_NAME, GOD_IMG, GOD_DESC, GOD_PRICE, GOD_DCRATE)
VALUES
('GOD00009', '풀업 바', '/mallimg/pull-up-bar.jpg','풀업 바', 69000, 35);
INSERT INTO T_GOODS 
(GOD_ID_VIEW, GOD_NAME, GOD_IMG, GOD_DESC, GOD_PRICE, GOD_DCRATE)
VALUES
('GOD00010', '운동 타월', '/mallimg/towel.jpg','운동 타월', 7000, 1);
INSERT INTO T_GOODS 
(GOD_ID_VIEW, GOD_NAME, GOD_IMG, GOD_DESC, GOD_PRICE, GOD_DCRATE)
VALUES
('GOD00011', '스트레칭 매트', '/mallimg/stretch-mat.jpg','스트레칭 매트', 26, 18);
INSERT INTO T_GOODS 
(GOD_ID_VIEW, GOD_NAME, GOD_IMG, GOD_DESC, GOD_PRICE, GOD_DCRATE)
VALUES
('GOD00012', '힙 밴드 세트', '/mallimg/hip-band.jpg','힙 밴드 세트', 140, 22);
INSERT INTO T_GOODS 
(GOD_ID_VIEW, GOD_NAME, God_IMG, God_DESC, God_PRICE, God_DCRATE)
VALUES
('GOD00013', '마사지 건', '/mallimg/massage-gun.jpg','마사지 건', 89000, 40);

SELECT  *
FROM    T_GOODS;

-------------------------------------------------------------------------------------------------------------------------------
-- AI REPORT (수정 및 통합)
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_AI_REPORT (
  AIR_ID int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  WOR_ID int NOT NULL,
  AI_SUMMARY text DEFAULT NULL,
  AI_RECOMMENDATIONS json DEFAULT NULL,
  AI_NEXT_INTENSITY VARCHAR(50) DEFAULT NULL,
  AI_RANK_PERCENT int DEFAULT NULL,
  REG_DT datetime DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT T_AI_REPORT_WOR_ID_FK FOREIGN KEY (WOR_ID) REFERENCES T_WORKOUT_RECORD (WOR_ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO T_AI_REPORT (WOR_ID, AI_SUMMARY, AI_RECOMMENDATIONS, AI_NEXT_INTENSITY, AI_RANK_PERCENT)
VALUES (1, '전반적으로 안정적인 자세를 유지하셨습니다. 특히 프랭크에서 보여준 코어 통제력이 훌륭합니다. 다만 하체 운동의 비중을 높이면 더 균형 잡힌 신체를 만들 수 있습니다.', '["스쿼트 시 호흡을 들이마시며 내려가고 내뱉으며 올라오세요.", "운동 후 5분간 정적 스트레칭으로 근육을 이완시키세요."]', '보통', 12);

SELECT  *
FROM    T_AI_REPORT;

COMMIT;
