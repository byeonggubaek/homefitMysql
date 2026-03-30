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
    MEM_ID: string;
    MEM_ID_ACT: string;
    MEM_NAME: string;
    MEM_NICKNAME: string;
    MEM_IMG: string;
    MEM_SEX: string;
    MEM_AGE: number;
    MEM_POINT: number;
    MEM_EXP_POINT: number;   //
    MEM_LVL: number;         //
    MES_ID : string;
    MES_NAME: string;
}
export interface MemberExists {
    STATUS: string;
    ERROR: string;
    USER?: Member;
}
/*=======================================================================================================
  홈 트레이닝 관련
=======================================================================================================*/
export interface WorkoutRecord {
  WOR_ID: string;
  WOR_DT: Date;
  WOO_ID: string;
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
  WOO_ID: string;
  WOO_NAME: string;
  WOO_IMG: string;
  WOO_UNIT: string;
  WOD_GUIDE: string;
  WOD_TARGET_REPS: number;
  WOD_TARGET_SETS: number;
}
export interface Workout {
  WOO_ID: string;
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
/*=======================================================================================================
  메뉴 관련
=======================================================================================================*/

export interface ChartData {
  COLUMNS: Record<string, any>;
  DATA: Record<string, any>;
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

