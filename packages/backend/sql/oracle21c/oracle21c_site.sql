REM ===============================================================================================================
REM Copyright : Copyright (c) 2026 by White Dog
REM Author : 109 
REM History : 2026-02-03 - 최초 작성 
REM Remark : oracle 용 SQL
REM ===============================================================================================================
SET TERMOUT OFF
SET ECHO OFF
SET DEFINE OFF;

REM ===============================================================================================================
REM = 메뉴삭제 
REM ===============================================================================================================
DROP TABLE T_NAV_SUB_ITEM;
DROP TABLE T_NAV_ITEM;
REM ===============================================================================================================
REM = 메뉴
REM ===============================================================================================================
CREATE TABLE T_NAV_ITEM
(
    NAV_ID      NVARCHAR2(7)    NOT NULL,
	NAV_NAME    NVARCHAR2(50)   NOT NULL,
    NAV_IMG     NVARCHAR2(256)  NULL,
	NAV_DESC    NVARCHAR2(512)  NULL, 
    CONSTRAINT T_NAV_ITEM_PK PRIMARY KEY (NAV_ID)  
);
-- 테이블 주석
COMMENT ON TABLE T_NAV_ITEM IS '메뉴 항목';

-- 컬럼 주석
COMMENT ON COLUMN T_NAV_ITEM.NAV_ID IS '메뉴 아이디';
COMMENT ON COLUMN T_NAV_ITEM.NAV_NAME IS '메뉴 이름';
COMMENT ON COLUMN T_NAV_ITEM.NAV_IMG IS '메뉴 이미지 경로';
COMMENT ON COLUMN T_NAV_ITEM.NAV_DESC IS '메뉴 설명';

INSERT INTO T_NAV_ITEM VALUES
(
    'NV00001', '운동', '/menu/T_WORKOUT.jpg','운동을 측정하고 기록합니다.'
);
INSERT INTO T_NAV_ITEM VALUES
(
    'NV00002', '기록', '/menu/history.jpg','운동 성과를 확인합니다.'
);
INSERT INTO T_NAV_ITEM VALUES
(
    'NV00003', '보상', '/menu/reward.jpg','포인트, 업적, 순위를 확인하며 쇼핑몰에서 운동용품을 구입할 수 있습니다.'
);
INSERT INTO T_NAV_ITEM VALUES
(
    'NV00004', '내정보', '/menu/member.jpg','개인 정보를 관리합니다.'
);
SELECT *
FROM   T_NAV_ITEM;
REM ===============================================================================================================
REM = 상세메뉴
REM ===============================================================================================================
CREATE TABLE T_NAV_SUB_ITEM
(
    NAV_ID      NVARCHAR2(7)    NOT NULL, 
    NAS_ID      NVARCHAR2(5)    NOT NULL,
	NAS_NAME    NVARCHAR2(50)   NOT NULL,
    NAS_IMG     NVARCHAR2(256)  NULL,
	NAS_DESC    NVARCHAR2(512)  NULL, 
    NAS_PAGE    NVARCHAR2(50)   NOT NULL,
    NAS_HREF    NVARCHAR2(256)  NOT NULL,
    CONSTRAINT T_NAV_SUB_ITEM_PK PRIMARY KEY (NAV_ID, NAS_ID),
    CONSTRAINT T_NAV_SUB_ITEM_NAV_ID_FK FOREIGN KEY (NAV_ID) REFERENCES T_NAV_ITEM(NAV_ID)    
);
-- 테이블 주석
COMMENT ON TABLE T_NAV_SUB_ITEM IS '서브 메뉴 항목';

-- 컬럼 주석
COMMENT ON COLUMN T_NAV_SUB_ITEM.NAV_ID IS '상위 메뉴 ID (T_NAV_ITEM 참조)';
COMMENT ON COLUMN T_NAV_SUB_ITEM.NAS_ID IS '서브 메뉴 ID';
COMMENT ON COLUMN T_NAV_SUB_ITEM.NAS_NAME IS '서브 메뉴 명칭';
COMMENT ON COLUMN T_NAV_SUB_ITEM.NAS_IMG IS '서브 메뉴 이미지 경로';
COMMENT ON COLUMN T_NAV_SUB_ITEM.NAS_DESC IS '서브 메뉴 설명';
COMMENT ON COLUMN T_NAV_SUB_ITEM.NAS_PAGE IS '연결된 페이지명';
COMMENT ON COLUMN T_NAV_SUB_ITEM.NAS_HREF IS '링크 URL (내부/외부)';

INSERT INTO T_NAV_SUB_ITEM VALUES
(
    'NV00001', 'S0001', '운동하기','/menu/tracking.jpg', '프로그램에 따라 운동을 수행합니다.', 'WorkoutTracking', '/workout/tracking'
);
INSERT INTO T_NAV_SUB_ITEM VALUES
(
    'NV00002', 'S0001', '운동내역','/menu/state.jpg', '운동 내역을 확인합니다.', 'HistoryState', '/history/state'
);
INSERT INTO T_NAV_SUB_ITEM VALUES
(
    'NV00002', 'S0002', '콘텐츠제작','/menu/content.jpg', '운동 내역으로 SNS 콘텐츠를 자동 생성합니다.', 'HistoryContent', '/history/content'
);
INSERT INTO T_NAV_SUB_ITEM VALUES
(
    'NV00003', 'S0001', '포인트','/menu/point.jpg', '운동 포인트를 확인합니다.', 'RewardPoint', '/reward/point'
);
INSERT INTO T_NAV_SUB_ITEM VALUES
(
    'NV00003', 'S0002', '업적','/menu/achievement.jpg', '운동 업적을 확인합니다.', 'RewardAchievement', '/reward/achievement'
);
INSERT INTO T_NAV_SUB_ITEM VALUES
(
    'NV00003', 'S0003', '순위','/menu/ranking.jpg', '운동 순위를 확인합니다.', 'RewardRanking', '/reward/ranking'
);
INSERT INTO T_NAV_SUB_ITEM VALUES
(
    'NV00003', 'S0004', '쇼핑몰','/menu/mall.jpg', '굿즈 또는 운동용품을 구매합니다.', 'RewardMall', '/reward/mall'
);
INSERT INTO T_NAV_SUB_ITEM VALUES
(
    'NV00004', 'S0001', '프로필','/menu/profile.jpg', '개인 정보를 관리합니다.', 'MemberProfile', '/member/profile'
);
INSERT INTO T_NAV_SUB_ITEM VALUES
(
    'NV00004', 'S0002', '회원등록','/menu/register.png', '개인 정보를 등록합니다.', 'MemberRegister', '/member/register'
);
INSERT INTO T_NAV_SUB_ITEM VALUES
(
    'NV00004', 'S0003', '운동목표','/menu/plan.jpg', '운동 목표를 설정하고 관리합니다.', 'MemberPlan', '/member/plan'
);
INSERT INTO T_NAV_SUB_ITEM VALUES
(
    'NV00004', 'S0004', '로그인','/menu/login.png', '로그인합니다..', 'MemberLogin', '/member/login'
);

SELECT *
FROM   T_NAV_SUB_ITEM;
REM ===============================================================================================================
REM = 코드삭제 
REM ===============================================================================================================
DROP TABLE T_MINOR_DESC;
DROP TABLE T_CODE_DESC;
REM ===============================================================================================================
REM # 코드 정의서
REM ===============================================================================================================
CREATE TABLE T_CODE_DESC
(
    COD_ID      NVARCHAR2(7)    NOT NULL,
    COD_NAME    NVARCHAR2(50)   NOT NULL,
    CONSTRAINT T_CODE_DESC_PK PRIMARY KEY (COD_ID) 
);
-- 테이블 주석
COMMENT ON TABLE T_CODE_DESC IS '코드 정의';

-- 컬럼 주석
COMMENT ON COLUMN T_CODE_DESC.COD_ID IS '코드 ID';
COMMENT ON COLUMN T_CODE_DESC.COD_NAME IS '코드 명칭';

INSERT INTO T_CODE_DESC VALUES ('CD00001', 'Payment Status');
INSERT INTO T_CODE_DESC VALUES ('CD00002', 'Payment Method');
INSERT INTO T_CODE_DESC VALUES ('CD00003', 'Sex');

SELECT  *
FROM    T_CODE_DESC; 

CREATE TABLE T_MINOR_DESC
(
    COD_ID      NVARCHAR2(7)    NOT NULL,
    MIN_ID      NVARCHAR2(5)    NOT NULL,
    MIN_NAME    NVARCHAR2(100)  NOT NULL,
    MIN_ORD     NUMBER          DEFAULT 0,
    CONSTRAINT T_MINOR_DESC_PK PRIMARY KEY (COD_ID, MIN_ID),
    CONSTRAINT T_MINOR_DESC_COD_ID_FK FOREIGN KEY (COD_ID) REFERENCES T_CODE_DESC(COD_ID)
);
-- 테이블 주석
COMMENT ON TABLE T_MINOR_DESC IS '코드 상세 정의 (소분류)';

-- 컬럼 주석
COMMENT ON COLUMN T_MINOR_DESC.COD_ID IS '상위 코드 ID (T_CODE_DESC 참조)';
COMMENT ON COLUMN T_MINOR_DESC.MIN_ID IS '소분류 코드 ID';
COMMENT ON COLUMN T_MINOR_DESC.MIN_NAME IS '소분류 코드 명칭';
COMMENT ON COLUMN T_MINOR_DESC.MIN_ORD IS '표시 순서 (오름차순 정렬)';

INSERT INTO T_MINOR_DESC VALUES ('CD00001', 'PY', '정산', 1);
INSERT INTO T_MINOR_DESC VALUES ('CD00001', 'PD', '진행중', 2);

INSERT INTO T_MINOR_DESC VALUES ('CD00002', 'CD', '신용카드', 1);
INSERT INTO T_MINOR_DESC VALUES ('CD00002', 'CH', '현금', 2);
INSERT INTO T_MINOR_DESC VALUES ('CD00002', 'KP', '카카오페이', 3);

INSERT INTO T_MINOR_DESC VALUES ('CD00003', 'M', '남성', 1);
INSERT INTO T_MINOR_DESC VALUES ('CD00003', 'F', '여성', 2);

SELECT  *
FROM    T_MINOR_DESC; 
REM ===============================================================================================================
REM = 테이블 칼럼 삭제 
REM ===============================================================================================================
DROP TABLE T_COLUMN_DESC;
REM ===============================================================================================================
REM # 테이블 칼럼 명세서
REM ===============================================================================================================
CREATE TABLE T_COLUMN_DESC
(
    COL_TBL_NAME    NVARCHAR2(30)   NOT NULL,
    COL_SEQ         NUMBER          NOT NULL,
    COL_ORD         NUMBER          NOT NULL,
    COL_ID          NVARCHAR2(20)   NOT NULL,
    COL_NAME        NVARCHAR2(50)   NOT NULL,
    COL_TYPE        NVARCHAR2(10)   NOT NULL,
    COL_WIDTH       NUMBER          DEFAULT 80,
    COL_SUM         NVARCHAR2(10)   NULL,
    CONSTRAINT T_COLUMN_DESC_PK PRIMARY KEY (COL_TBL_NAME, COL_SEQ)  -- 
);
-- 테이블 주석
COMMENT ON TABLE T_COLUMN_DESC IS '동적 테이블 컬럼 정의 (그리드 설정)';

-- 컬럼 주석
COMMENT ON COLUMN T_COLUMN_DESC.COL_TBL_NAME IS '대상 테이블명';
COMMENT ON COLUMN T_COLUMN_DESC.COL_SEQ IS '컬럼 순번 (PK)';
COMMENT ON COLUMN T_COLUMN_DESC.COL_ORD IS '화면 표시 순서';
COMMENT ON COLUMN T_COLUMN_DESC.COL_ID IS '컬럼 기술명 (DB 컬럼명)';
COMMENT ON COLUMN T_COLUMN_DESC.COL_NAME IS '컬럼 한글 표시명';
COMMENT ON COLUMN T_COLUMN_DESC.COL_TYPE IS '컬럼 타입 (text,number,date 등)';
COMMENT ON COLUMN T_COLUMN_DESC.COL_WIDTH IS '컬럼 너비 (기본 80px)';
COMMENT ON COLUMN T_COLUMN_DESC.COL_SUM IS '합계 표시 여부 (Y/N)';

INSERT INTO T_COLUMN_DESC VALUES ('WorkoutRecord', 1, 1, 'id', '운동번호', 'key', 80, null);
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutRecord', 2, 2, 'wo_dt', '운동일', 'dat', 100, null);
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutRecord', 3, 3, 'title', '운동명', 'lst', 100, null);
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutRecord', 4, 4, 'target_reps', '반복횟수', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutRecord', 5, 5, 'target_sets', '세트수', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutRecord', 6, 6, 'count', '실행횟수', 'qty', 100, 'sum');  
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutRecord', 7, 7, 'point', '획득포인트', 'qty', 100, 'sum');  
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutRecord', 8, 8, 'description', '운동내역', 'str', 100, 'sum');  

INSERT INTO T_COLUMN_DESC VALUES ('WorkoutAchievement', 1, 1, 'id', '운동번호', 'key', 80, null);
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutAchievement', 2, 2, 'wo_dt', '운동일', 'dat', 100, null);
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutAchievement', 3, 3, 'title', '운동명', 'lst', 100, null);
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutAchievement', 4, 4, 'target_reps', '반복횟수', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutAchievement', 5, 5, 'target_sets', '세트수', 'qty', 100, 'sum');
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutAchievement', 6, 6, 'count_p', '권장횟수', 'qty', 100, 'sum');  
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutAchievement', 7, 7, 'count', '실행횟수', 'qty', 100, 'sum');  
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutAchievement', 8, 8, 'count_s', '잔여횟수', 'qty', 100, 'sum');  
INSERT INTO T_COLUMN_DESC VALUES ('WorkoutAchievement', 9, 9, 'description', '운동내역', 'str', 100, 'sum');  

SELECT *
FROM   T_COLUMN_DESC
WHERE  COL_TBL_NAME = 'WorkoutRecord';
REM ===============================================================================================================
REM = 홈트 테이블 삭제  
REM ===============================================================================================================
DROP TABLE T_WORKOUT_DETAIL;
DROP TABLE T_WORKOUT_RECORD;
DROP TABLE T_MEMBER;
DROP TABLE T_WORKOUT;
DROP TABLE T_ACHIEVEMENT;
DROP TABLE T_REWARD;
DROP TABLE T_INVOICE;
DROP TABLE T_MEMBERSHIP_BENIFIT;
DROP TABLE T_MEMBERSHIP;
DROP TABLE T_BENIFIT;
REM ===============================================================================================================
REM = 혜택 
REM ===============================================================================================================
CREATE TABLE T_BENIFIT
(
    BEN_ID 			NVARCHAR2(7)		NOT NULL,
    BEN_NAME       	NVARCHAR2(50)		NOT NULL,
    CONSTRAINT T_BENIFIT_PK PRIMARY KEY (BEN_ID)
);
-- 테이블 주석
COMMENT ON TABLE T_BENIFIT IS '혜택';

-- 컬럼 주석
COMMENT ON COLUMN T_BENIFIT.BEN_ID IS '혜택 코드';
COMMENT ON COLUMN T_BENIFIT.BEN_NAME IS '혜택 명칭';

INSERT INTO T_BENIFIT 
VALUES('BN00001', '기본 운동 기록');
INSERT INTO T_BENIFIT 
VALUES('BN00002', '통계 데이터 생성');
INSERT INTO T_BENIFIT 
VALUES('BN00003', '포인트 2배 적립');
INSERT INTO T_BENIFIT 
VALUES('BN00004', '월간 랭킹 계산');
INSERT INTO T_BENIFIT 
VALUES('BN00005', '맞춤 운동 추천');
INSERT INTO T_BENIFIT 
VALUES('BN00006', 'VIP + 프리미엄 전용 콘텐츠');
INSERT INTO T_BENIFIT 
VALUES('BN00007', '광고 완전 제거');

SELECT	*
FROM	T_BENIFIT;
--------------------------------------------------------------------------------------------------------------------------------
-- 회원등급
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_MEMBERSHIP
(
    MBS_ID 			NVARCHAR2(7)		NOT NULL,
    MBS_NAME       	NVARCHAR2(50)		NOT NULL,
    CONSTRAINT T_MEMBERSHIP_PK PRIMARY KEY (MBS_ID)
);
-- 테이블 주석
COMMENT ON TABLE T_MEMBERSHIP IS '회원 등급';

-- 컬럼 주석
COMMENT ON COLUMN T_MEMBERSHIP.MBS_ID IS '회원 등급 코드';
COMMENT ON COLUMN T_MEMBERSHIP.MBS_NAME IS '회원 등급 명칭';

INSERT INTO T_MEMBERSHIP 
VALUES('MS00001', 'FREE');
INSERT INTO T_MEMBERSHIP 
VALUES('MS00002', 'PREMINIUM');
INSERT INTO T_MEMBERSHIP 
VALUES('MS00003', 'VIP');

SELECT	*
FROM	T_MEMBERSHIP;
--------------------------------------------------------------------------------------------------------------------------------
-- 회원등급별 혜택 
--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE T_MEMBERSHIP_BENIFIT
(
    MBS_ID 			NVARCHAR2(7)		NOT NULL,
    BEN_ID			NVARCHAR2(7)		NOT NULL,
    CONSTRAINT T_MEMBERSHIP_BENIFIT_PK PRIMARY KEY (MBS_ID, BEN_ID),
    CONSTRAINT T_MEMBERSHIP_MSP_ID_FK FOREIGN KEY (MBS_ID) REFERENCES T_MEMBERSHIP(MBS_ID),
    CONSTRAINT T_MEMBERSHIP_BEN_ID_FK FOREIGN KEY (BEN_ID) REFERENCES T_BENIFIT(BEN_ID)    
);
-- 테이블 주석
COMMENT ON TABLE T_MEMBERSHIP_BENIFIT IS '회원등급별 혜택';

-- 컬럼 주석
COMMENT ON COLUMN T_MEMBERSHIP_BENIFIT.MBS_ID IS '회원 등급 ID (T_MEMBERSHIP 참조)';
COMMENT ON COLUMN T_MEMBERSHIP_BENIFIT.BEN_ID IS '혜택 ID (T_BENIFIT 참조)';

INSERT INTO T_MEMBERSHIP_BENIFIT 
VALUES('MS00001', 'BN00001');
INSERT INTO T_MEMBERSHIP_BENIFIT 
VALUES('MS00001', 'BN00002');
INSERT INTO T_MEMBERSHIP_BENIFIT 
VALUES('MS00002', 'BN00001');
INSERT INTO T_MEMBERSHIP_BENIFIT 
VALUES('MS00002', 'BN00002');
INSERT INTO T_MEMBERSHIP_BENIFIT 
VALUES('MS00002', 'BN00003');
INSERT INTO T_MEMBERSHIP_BENIFIT 
VALUES('MS00002', 'BN00004');
INSERT INTO T_MEMBERSHIP_BENIFIT 
VALUES('MS00002', 'BN00005');
INSERT INTO T_MEMBERSHIP_BENIFIT 
VALUES('MS00003', 'BN00001');
INSERT INTO T_MEMBERSHIP_BENIFIT 
VALUES('MS00003', 'BN00002');
INSERT INTO T_MEMBERSHIP_BENIFIT 
VALUES('MS00003', 'BN00003');
INSERT INTO T_MEMBERSHIP_BENIFIT 
VALUES('MS00003', 'BN00004');
INSERT INTO T_MEMBERSHIP_BENIFIT 
VALUES('MS00003', 'BN00005');
INSERT INTO T_MEMBERSHIP_BENIFIT 
VALUES('MS00003', 'BN00006');
INSERT INTO T_MEMBERSHIP_BENIFIT 
VALUES('MS00003', 'BN00007');
SELECT	*
FROM	T_MEMBERSHIP_BENIFIT;
REM ===============================================================================================================
REM = 회원 
REM ===============================================================================================================
CREATE TABLE T_MEMBER
(
    MEM_JOIN_ID     NUMBER          NOT NULL,
    MEM_ID          NVARCHAR2(50)   NOT NULL,
	MEM_NAME        NVARCHAR2(50)   NOT NULL,
    MEM_NICKNAME    NVARCHAR2(50)   NULL,    
    MEM_PASSWORD    NVARCHAR2(256)  NOT NULL,
    MEM_IMG         NVARCHAR2(256)  NULL,
	MEM_SEX         NVARCHAR2(2)    NOT NULL,
    MEM_AGE         NUMBER          DEFAULT 0, 
    MEM_POINT       NUMBER          DEFAULT 0,
    MEM_EXP_POINT   NUMBER          DEFAULT 0, 
    MEM_LVL         NUMBER          DEFAULT 0, -- 4500 점마다 1Lvl 증가
    MBS_ID 			NVARCHAR2(7)	NOT NULL,
    CONSTRAINT T_MEMBER_PK PRIMARY KEY (MEM_JOIN_ID),
    CONSTRAINT T_MEMBER_MBS_ID_FK FOREIGN KEY (MBS_ID) REFERENCES T_MEMBERSHIP(MBS_ID)        
);
DROP SEQUENCE SEQ_T_MEMBER;
CREATE SEQUENCE SEQ_T_MEMBER START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE OR REPLACE TRIGGER TRG_T_MEMBER_ID
    BEFORE INSERT ON T_MEMBER
    FOR EACH ROW
BEGIN
    IF :NEW.MEM_JOIN_ID IS NULL THEN
        :NEW.MEM_JOIN_ID := SEQ_T_MEMBER.NEXTVAL;
    END IF;
END;
/
-- 테이블 주석
COMMENT ON TABLE T_MEMBER IS '회원 마스터';

-- 컬럼 주석
COMMENT ON COLUMN T_MEMBER.MEM_JOIN_ID IS '회원 가입 고유 ID (자동증가)';
COMMENT ON COLUMN T_MEMBER.MEM_ID IS '회원 ID (이메일 또는 사용자ID)';
COMMENT ON COLUMN T_MEMBER.MEM_NAME IS '회원 실명';
COMMENT ON COLUMN T_MEMBER.MEM_NICKNAME IS '닉네임';
COMMENT ON COLUMN T_MEMBER.MEM_PASSWORD IS '패스워드 해시값';
COMMENT ON COLUMN T_MEMBER.MEM_IMG IS '회원 이미지 경로';
COMMENT ON COLUMN T_MEMBER.MEM_SEX IS '성별 코드 (T_MINOR_DESC : CD00003 참조)';
COMMENT ON COLUMN T_MEMBER.MEM_AGE IS '나이';
COMMENT ON COLUMN T_MEMBER.MEM_POINT IS '현재 포인트';
COMMENT ON COLUMN T_MEMBER.MEM_EXP_POINT IS '누적 경험치 (4500점=1레벨)';
COMMENT ON COLUMN T_MEMBER.MEM_LVL IS '회원 레벨';
COMMENT ON COLUMN T_MEMBER.MBS_ID IS '회원 등급 코드 (T_MEMBERSHIP 참조)';

INSERT INTO T_MEMBER 
( MEM_ID, MEM_NAME, MEM_NICKNAME, MEM_PASSWORD, MEM_IMG, MEM_SEX, MEM_AGE, MEM_POINT, MEM_EXP_POINT, MEM_LVL, MBS_ID )
VALUES
('oranjes@naver.com', '백병구', '쥐', member_hash_password('oranjes@naver.com', '1234'), '/member/U000001.jpg','M', 52, 600, 1600, 1, 'MS00003');
INSERT INTO T_MEMBER 
( MEM_ID, MEM_NAME, MEM_NICKNAME, MEM_PASSWORD, MEM_IMG, MEM_SEX, MEM_AGE, MEM_POINT, MEM_EXP_POINT, MEM_LVL, MBS_ID )
VALUES
('moon@naver.com', '문정인', '고양이', member_hash_password('moon@naver.com', '1234'), '/member/u000002.jpg','F', 24, 50, 1050, 1, 'MS00002');
INSERT INTO T_MEMBER 
( MEM_ID, MEM_NAME, MEM_NICKNAME, MEM_PASSWORD, MEM_IMG, MEM_SEX, MEM_AGE, MEM_POINT, MEM_EXP_POINT, MEM_LVL, MBS_ID )
VALUES
('sungyun@naver.com', '문성윤', '소', member_hash_password('sungyun@naver.com', '1234'), '/member/u000003.jpg','M', 40, 0, 0, 1, 'MS00001');
INSERT INTO T_MEMBER 
( MEM_ID, MEM_NAME, MEM_NICKNAME, MEM_PASSWORD, MEM_IMG, MEM_SEX, MEM_AGE, MEM_POINT, MEM_EXP_POINT, MEM_LVL, MBS_ID )
VALUES
('donggeon@naver.com', '김동건', '호랑이', member_hash_password('donggeon@naver.com', '1234'), '/member/u000004.jpg','M', 26, 0, 0, 1, 'MS00001');

SELECT *
FROM   T_MEMBER;
REM ===============================================================================================================
REM = 운동
REM ===============================================================================================================
CREATE TABLE T_WORKOUT
(
    WKO_ID      NVARCHAR2(7)    NOT NULL,
	WKO_NAME    NVARCHAR2(50)   NOT NULL,
    WKO_IMG     NVARCHAR2(256)  NULL,
	WKO_DESC    NVARCHAR2(512)  NULL, 
    WKO_GUIDE   NVARCHAR2(512)  NULL,
    CONSTRAINT T_WORKOUT_PK PRIMARY KEY (WKO_ID)  -- 
);
-- 테이블 주석
COMMENT ON TABLE T_WORKOUT IS '운동 마스터';

-- 컬럼 주석
COMMENT ON COLUMN T_WORKOUT.WKO_ID IS '운동 ID';
COMMENT ON COLUMN T_WORKOUT.WKO_NAME IS '운동 이름';
COMMENT ON COLUMN T_WORKOUT.WKO_IMG IS '운동 이미지 경로';
COMMENT ON COLUMN T_WORKOUT.WKO_DESC IS '운동 설명 (효과, 주의사항 등)';
COMMENT ON COLUMN T_WORKOUT.WKO_GUIDE IS '운동 가이드 (자세/횟수 안내)';

INSERT INTO T_WORKOUT VALUES
(
    'WK00001', '프랭크', '/T_WORKOUT/plank.png','코어 근육(복근, 허리, 등)을 강화하는 운동으로, 몸을 널빤지처럼 일직선으로 유지하는 동작입니다.', '30초 동안 자세 유지하기'
);
INSERT INTO T_WORKOUT VALUES
(
    'WK00002', '스쿼트', '/T_WORKOUT/squat.png','하체 근육(허벅지, 엉덩이)을 강화하는 운동으로, 무릎과 엉덩이를 굽히고 펴는 동작입니다.', '다리를 어깨 너비로 벌리고 앉았다 일어나기'
);
INSERT INTO T_WORKOUT VALUES
(
    'WK00003', '푸시업', '/T_WORKOUT/pushup.png','상체 근육(가슴, 어깨, 삼두근)을 강화하는 운동으로, 팔을 굽히고 펴는 동작입니다.', '손은 어깨너비보다 약간 넓게, 손가락은 앞쪽으로 향하게 위치'
);
INSERT INTO T_WORKOUT VALUES
(
    'WK00004', '런지', '/T_WORKOUT/lunge.png','하체 근육(허벅지, 엉덩이)을 강화하는 운동으로, 한쪽 다리를 앞으로 내딛고 무릎을 굽히는 동작입니다.', '좌우 각 10회씩 반복하기'
);

SELECT *
FROM   T_WORKOUT;
REM ===============================================================================================================
REM = 운동기록 
REM ===============================================================================================================
CREATE TABLE T_WORKOUT_RECORD 
(
    WKR_ID      NVARCHAR2(7)    NOT NULL,
    MEM_JOIN_ID NUMBER          NOT NULL,
	WKR_DT      DATE            DEFAULT SYSDATE,
    WKR_DESC    NVARCHAR2(512)  NOT NULL, 
    CONSTRAINT T_WORKOUT_RECORD_PK PRIMARY KEY (WKR_ID), 
    CONSTRAINT T_WORKOUT_RECORD_MEM_J_ID_FK FOREIGN KEY (MEM_JOIN_ID) REFERENCES T_MEMBER(MEM_JOIN_ID)    
);
-- 테이블 주석
COMMENT ON TABLE T_WORKOUT_RECORD IS '회원 운동 기록';

-- 컬럼 주석
COMMENT ON COLUMN T_WORKOUT_RECORD.WKR_ID IS '운동 기록 ID (고유 코드)';
COMMENT ON COLUMN T_WORKOUT_RECORD.MEM_JOIN_ID IS '회원 가입 ID (T_MEMBER 참조)';
COMMENT ON COLUMN T_WORKOUT_RECORD.WKR_DT IS '운동 기록 날짜 (기본값: 현재일시)';
COMMENT ON COLUMN T_WORKOUT_RECORD.WKR_DESC IS '운동 내용 (운동명/세트/횟수 등)';

INSERT INTO T_WORKOUT_RECORD VALUES
(
    'WR00001', 1, '2026-03-01', '첫번째 운동'
);
INSERT INTO T_WORKOUT_RECORD VALUES
(
    'WR00002', 1, '2026-03-02', '두번째 운동'
);
INSERT INTO T_WORKOUT_RECORD VALUES
(
    'WR00003', 2, '2026-03-01', '첫번째 운동'
);
INSERT INTO T_WORKOUT_RECORD VALUES
(
    'WR00004', 2, '2026-03-02', '두번째 운동'
);

SELECT *
FROM   T_WORKOUT_RECORD;
REM ===============================================================================================================
REM = 운동상세
REM ===============================================================================================================
CREATE TABLE T_WORKOUT_DETAIL 
(
    WKR_ID          NVARCHAR2(7)    NOT NULL,
    WKO_ID          NVARCHAR2(7)    NOT NULL,
    WKD_TARGET_REPS NUMBER          DEFAULT 0, -- 권장운동횟수
    WKD_TARGET_SETS NUMBER          DEFAULT 0, -- 권장세트수
    WKD_COUNT       NUMBER          DEFAULT 0, -- 실제운동횟수
    WKD_POINT       NUMBER          DEFAULT 0, -- 운동포인트
    WKD_ACCURACY    NUMBER          DEFAULT 0, -- 운동정확도
    WKD_TIME		INT 		    DEFAULT 0, -- 운동시간    
    CONSTRAINT T_WORKOUT_DETAIL_PK PRIMARY KEY (WKR_ID, WKO_ID),  -- 
    CONSTRAINT T_WORKOUT_DETAIL_WKR_ID_FK FOREIGN KEY (WKR_ID) REFERENCES T_WORKOUT_RECORD(WKR_ID),    
    CONSTRAINT T_WORKOUT_DETAIL_WKO_ID_FK FOREIGN KEY (WKO_ID) REFERENCES T_WORKOUT(WKO_ID)
);
-- 테이블 주석
COMMENT ON TABLE T_WORKOUT_DETAIL IS '운동 상세 기록';

-- 컬럼 주석
COMMENT ON COLUMN T_WORKOUT_DETAIL.WKR_ID IS '상위 운동 기록 ID (T_WORKOUT_RECORD)';
COMMENT ON COLUMN T_WORKOUT_DETAIL.WKO_ID IS '운동 종류 ID (T_WORKOUT)';
COMMENT ON COLUMN T_WORKOUT_DETAIL.WKD_TARGET_REPS IS '목표 반복 횟수';
COMMENT ON COLUMN T_WORKOUT_DETAIL.WKD_TARGET_SETS IS '목표 세트 수';
COMMENT ON COLUMN T_WORKOUT_DETAIL.WKD_COUNT IS '실제 완료 횟수';
COMMENT ON COLUMN T_WORKOUT_DETAIL.WKD_POINT IS '획득 포인트';
COMMENT ON COLUMN T_WORKOUT_DETAIL.WKD_ACCURACY IS '운동 정확도 (0-100%)';
COMMENT ON COLUMN T_WORKOUT_DETAIL.WKD_TIME IS '운동 소요 시간 (분)';

INSERT INTO T_WORKOUT_DETAIL VALUES
(
    'WR00001', 'WK00001', 15, 3, 45, 450, 92, 10
);
INSERT INTO T_WORKOUT_DETAIL VALUES
(
    'WR00001', 'WK00002', 30, 2, 60, 600, 88, 10
);
INSERT INTO T_WORKOUT_DETAIL VALUES
(
    'WR00001', 'WK00003', 20, 3, 55, 550, 94, 10
);
INSERT INTO T_WORKOUT_DETAIL VALUES
(
    'WR00002', 'WK00001', 15, 3, 0, 0, 0, 0
);
INSERT INTO T_WORKOUT_DETAIL VALUES
(
    'WR00003', 'WK00001', 15, 3, 0, 0, 0, 0
);
INSERT INTO T_WORKOUT_DETAIL VALUES
(
    'WR00003', 'WK00002', 30, 2, 60, 600, 80, 10
);
INSERT INTO T_WORKOUT_DETAIL VALUES
(
    'WR00004', 'WK00001', 15, 3, 45, 450, 78, 10
);

SELECT *
FROM   T_WORKOUT_DETAIL;
REM ===============================================================================================================
REM = 업적
REM ===============================================================================================================
CREATE TABLE T_ACHIEVEMENT
(
    ACH_ID      NVARCHAR2(7)    NOT NULL,
	ACH_NAME    NVARCHAR2(50)   NOT NULL,
    ACH_IMG     NVARCHAR2(256)  NULL,
	ACH_DESC    NVARCHAR2(512)  NULL, 
    CONSTRAINT T_ACHIEVEMENT_PK PRIMARY KEY (ACH_ID)  -- 
);
-- 테이블 주석
COMMENT ON TABLE T_ACHIEVEMENT IS '업적 마스터';

-- 컬럼 주석
COMMENT ON COLUMN T_ACHIEVEMENT.ACH_ID IS '업적 ID (고유 코드)';
COMMENT ON COLUMN T_ACHIEVEMENT.ACH_NAME IS '업적 명칭';
COMMENT ON COLUMN T_ACHIEVEMENT.ACH_IMG IS '업적 배지 이미지';
COMMENT ON COLUMN T_ACHIEVEMENT.ACH_DESC IS '업적 달성 조건 및 설명';

INSERT INTO T_ACHIEVEMENT VALUES
(
    'AC00001', '첫 운동 완료', '/achievement/first.jpg','첫번째 운동을 완료.'
);
INSERT INTO T_ACHIEVEMENT VALUES
(
    'AC00002', '주간 챔피언', '/achievement/weeklychamp.jpg','일주일 동안 5회 운동 완료.'
);
INSERT INTO T_ACHIEVEMENT VALUES
(
    'AC00003', '완벽한 자세', '/achievement/perfectposture.jpg','자세 정확도 95% 이상 달성.'
);
INSERT INTO T_ACHIEVEMENT VALUES
(
    'AC00004', '꾸준함의 달인', '/achievement/consistency.jpg','7일 연속 운동 완료.'
);
INSERT INTO T_ACHIEVEMENT VALUES
(
    'AC00005', '100회 클럽', '/achievement/hundredclub.jpg','100회 운동 완료.'
);

SELECT *
FROM   T_ACHIEVEMENT;
REM ===============================================================================================================
REM = 보상
REM ===============================================================================================================
CREATE TABLE T_REWARD
(
    REW_ID      NVARCHAR2(7)    NOT NULL,
	REW_NAME    NVARCHAR2(14)   NOT NULL,
    REW_IMG     NVARCHAR2(256)  NULL,
	REW_DESC    NVARCHAR2(512)  NULL, 
    CONSTRAINT T_REWARD_PK PRIMARY KEY (REW_ID)  -- 
);
-- 테이블 주석
COMMENT ON TABLE T_REWARD IS '리워드 마스터';

-- 컬럼 주석
COMMENT ON COLUMN T_REWARD.REW_ID IS '리워드 ID (고유 코드)';
COMMENT ON COLUMN T_REWARD.REW_NAME IS '리워드 제목';
COMMENT ON COLUMN T_REWARD.REW_IMG IS '리워드 이미지';
COMMENT ON COLUMN T_REWARD.REW_DESC IS '리워드 상세 설명 (포인트/아이템 정보)';

INSERT INTO T_REWARD VALUES
(
    'RW00001', '맞춤 운동 프로그램', '/reward/custom_program.jpg','AI가 나만의 운동 프로그램을 생성해줍니다'
);
INSERT INTO T_REWARD VALUES
(
    'RW00002', '홈트레이닝 용품 할인', '/reward/home_training_discount.jpg','홈트레이닝 용품을 할인된 가격에 구매하세요'
);
INSERT INTO T_REWARD VALUES
(
    'RW00003', '영양 가이드북', '/reward/nutrition_guide.jpg','영양 가이드북을 제공합니다'
);
INSERT INTO T_REWARD VALUES
(
    'RW00004', 'SNS 콘텐츠 제작권', '/reward/sns_content.jpg','SNS 콘텐츠를 제작할 수 있는 권한을 제공합니다'
);
INSERT INTO T_REWARD VALUES
(
    'RW00005', '1:1 온라인 상담', '/reward/online_consultation.jpg','전문 트레이너와 30분 온라인 상담'
);

SELECT *
FROM   T_REWARD;
REM ===============================================================================================================
REM = 매출
REM ===============================================================================================================
CREATE TABLE T_INVOICE
(
    INV_ID 			VARCHAR(7)	NOT NULL,
	INV_DT 			DATE 		DEFAULT SYSDATE,
    MEM_JOIN_ID		NUMBER      NOT NULL,
	INV_TOT_AMT		INT 		DEFAULT 0, 
    INV_USED_POINT	INT 		DEFAULT 0,
    CONSTRAINT T_INVOICE_PK PRIMARY KEY (INV_ID) 
);
-- 테이블 주석
COMMENT ON TABLE T_INVOICE IS '매출 내역';

-- 컬럼 주석
COMMENT ON COLUMN T_INVOICE.INV_ID IS '매출 내역 ID';
COMMENT ON COLUMN T_INVOICE.INV_DT IS '매출 일시 (기본값: 현재일시)';
COMMENT ON COLUMN T_INVOICE.MEM_JOIN_ID IS '회원 가입 ID (T_MEMBER 참조)';
COMMENT ON COLUMN T_INVOICE.INV_TOT_AMT IS '결제 총액';
COMMENT ON COLUMN T_INVOICE.INV_USED_POINT IS '사용 포인트';

INSERT INTO T_INVOICE VALUES
('IV00001', '2026-03-20', 1,12000,1000);
INSERT INTO T_INVOICE VALUES
('IV00002', '2026-03-19', 1,14000,0);
INSERT INTO T_INVOICE VALUES
('IV00003', '2026-03-20', 2,13000,1000);

SELECT  *
FROM    T_INVOICE

COMMIT;

SET TERMOUT ON
SET ECHO ON
SET DEFINE ON;

