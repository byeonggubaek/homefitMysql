import 'react';

/*=======================================================================================================
  메뉴
=======================================================================================================*/
export interface NavSubItem {
  NAS_ID: string,
  NAS_NAME: string;
  NAS_HREF: string,  
  NAS_DESC: string;
}
export interface NavItem {
  NAV_ID: string,
  NAV_NAME: string;
  NAV_IMG: string;
  NAV_DESC: string;
  NAV_SUB_MENUS: NavSubItem[];
}
export interface MenuPos {
  NAV_ID: string,
  NAS_ID: string;
  NAV_NAME: string,
  NAS_NAME: string;
  NAS_SIBLINGS: NavSubItem[];
}
/*=======================================================================================================
  테이블 관련 
=======================================================================================================*/
export interface ColDesc {
  COL_ID: string;
  COL_NAME: string;
  COL_TYPE: string;
  COL_WIDTH?: number;
  COL_SUM?: string;
  COL_AGG?: number;
}
/*=======================================================================================================
  회원정보
=======================================================================================================*/
export interface Member {
    MEM_ID: number;
    MEM_ID_VIEW: string;
    MEM_NAME: string;
    MEM_NICKNAME: string;
    MEM_IMG: string;
    MEM_PNUMBER: string;
    MEM_EMAIL: string;
    MEM_SEX: string;
    MEM_AGE: number;
    MEM_POINT: number;
    MEM_EXP_POINT: number;   //
    MEM_LVL: number;         //
    MEM_STREAK: number;    
    MES_ID : number;
    MES_NAME: string;
    MES_FEE: number;
}
export interface MemberExists {
    STATUS: string;
    ERROR: string;
    USER?: Member;
}
export interface Benefit {
  BEN_ID: string;
  BEN_NAME: string;
}
export interface Membership {
  MES_ID: number;
  MES_NAME: string;
  MES_FEE: number;
  MES_BENEFITS: Benefit[];
}
/*=======================================================================================================
  홈 트레이닝 관련
=======================================================================================================*/
export interface WorkoutRecord {
  WOR_ID: number;
  WOR_ID_VIEW: string;
  WOR_DT: Date;
  WOO_ID: number;
  WOO_NAME: string;
  WOO_NAME_COLOR: string;
  WOD_TARGET_REPS: number;
  WOD_TARGET_SETS: number;
  WOD_COUNT_P: number;
  WOD_COUNT: number;
  WOD_COUNT_S: number;
  WOD_POINT: number;
  WOR_DESC?: string;
}
export interface WorkoutHistory {
  WO_DT: string;
  STATUS: string;
}
export interface WorkoutDetail {
  WOO_ID: number;
  WOO_NAME: string;
  WOO_IMG: string;
  WOO_UNIT: string;
  WOD_GUIDE: string;
  WOD_TARGET_REPS: number;
  WOD_TARGET_SETS: number;
}
export interface CurWorkoutRecord 
{
  WOR_ID: number;
  WOR_ID_VIEW: string;
}
export interface Workout {
  WOO_ID: number;
  WOO_NAME: string;
  WOO_IMG: string;
  WOO_UNIT: string;
  WOO_GUIDE: string;
  WOO_TARGET_REPS: number;
  WOO_TARGET_SETS: number;
}
export interface RankingItem {
  RANK: number;
  MEM_ID: number;
  MEM_NAME: string;
  MEM_IMG: string;
  CNT: number;
  WORKOUT_TIME: number;
}
export interface Goods 
{
  GOD_ID: number;   // PK (AUTO_INCREMENT)
  GOD_ID_VIEW : string;   // varchar(8)
  GOD_NAME    : string;   // varchar(50)
  GOD_PRICE   : number;   // int
  GOD_DCRATE  : number;   // int
  GOD_IMG     : string | null;  // varchar(256), nullable
}
/*=======================================================================================================
  등록 관련
=======================================================================================================*/
export interface T_MEMBER {
    MEM_ID?: number;          // PK (AUTO_INCREMENT)
    MEM_ID_VIEW: string;      // 회원 시각적 ID (예: MEM_00001)
    MEM_NAME: string;         // 이름
    MEM_NICKNAME?: string | null;
    MEM_PASSWORD: string;     // 패스워드 해시
    MEM_IMG?: string | null;
    MEM_PNUMBER?: string | null;
    MEM_EMAIL?: string | null;
    MEM_SEX: string | null;
    MEM_AGE: number;
    MEM_POINT: number;
    MEM_EXP_POINT: number;
    MEM_LVL: number;
    MEM_STREAK: number;
    MES_ID: number;           // 등급 코드 (FK)
}
export interface T_WORKOUT_RECORD {
    WOR_ID?: number;           // Primary Key (AUTO_INCREMENT)
    WOR_ID_VIEW: string;       // 운동기록 시각적 ID (예: WOR_00001)
    MEM_ID: number;            // 회원 ID
    WOR_DT?: string | Date | null; // 운동일
    WOR_DESC?: string | null;  // 운동 설명
}
export interface T_WORKOUT_DETAIL {
    WOR_ID: number;           // FK & PK (운동기록 ID)
    WOO_ID: number;           // FK & PK (운동 ID)
    WOD_GUIDE?: string | null; // 운동 가이드
    WOD_TARGET_REPS: number;  // 권장 횟수
    WOD_TARGET_SETS: number;  // 권장 세트수
    WOD_COUNT: number;        // 실제 실행 횟수
    WOD_POINT: number;        // 획득 포인트
    WOD_ACCURACY: number;     // 운동 정확도
    WOD_TIME: number;         // 운동시간(분)
}
export interface PointHistory {
  wo_dt: Date | string; // MySQL DATE 타입은 환경에 따라 문자열로 올 수도 있어 유연하게 지정
  img: string;
  accuracy: number;
  point: number;
  title: string;
  type: 'earned' | 'used'; // 타입을 명확히 제한하면 개발 시 자동완성 도움을 받기 좋습니다.
}
/*=======================================================================================================
  메뉴 관련
=======================================================================================================*/
export interface ChartData {
  VSQL: string | null;
  DATA: any;
  COLUMNS: any;
}
/*=======================================================================================================
  우편번호 
=======================================================================================================*/
export interface Postcode {
  POSTCODE: string;
  ADDRESS: string;
  ROAD_ADDRESS: string;
}
/*=======================================================================================================
  카카오지도  
=======================================================================================================*/
export interface MapPosition {
  LAT: number;
  LNG: number;
}
export interface BusinessTypeResult {
  NAME: string;
  FULL_CATEGORY: string;        // 전체: "음식점 > 한식 > 김밥"
  LEAF_CATEGORY: string;        // 최종 말단: "김밥"
  MAIN_CATEGORY: string;        // 메인: "음식점"
  SUB_CATEGORY: string;         // 중분류: "한식"
}
export interface ShopLocation {
  NAME: string;
  FULL_ADDRESS: string;
  COORDS: { LAT: number; LNG: number };
  CATEGORY: string;
  MATCH_SCORE: number; // 일치도 점수 (0-100)
}

declare module 'express-session' {
  interface SessionData {
    user: Member | null;
    isLogined: boolean;
  }
}

