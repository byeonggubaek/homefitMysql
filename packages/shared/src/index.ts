/*=======================================================================================================
  메뉴
=======================================================================================================*/
export interface NavSubItem {
  nas_id: string,
  nas_name: string;
  nas_href: string,  
  nas_desc: string;
}
export interface NavItem {
  nav_id: string,
  nav_name: string;
  nav_img: string;
  nav_desc: string;
  sub_menus: NavSubItem[];
}
export interface MenuPos {
  nav_id: string,
  nav_name: string,
  nas_id: string;
  nas_name: string;
  siblings: NavSubItem[];
}
/*=======================================================================================================
  테이블 관련 
=======================================================================================================*/
export interface ColDesc {
  col_id: string;
  col_name: string;
  col_type: string;
  col_width?: number;
  col_sum?: string;
  col_agg?: number;
}
/*=======================================================================================================
  회원정보
=======================================================================================================*/
export interface Member {
    mem_id: string;
    mem_name: string;
    mem_nickname: string;
    mem_img: string;
    mem_sex: string;
    mem_age: number;
    mem_point: number;
    mem_exp_point: number;   //
    mem_lvl: number;         //
    mes_id : string;
    mes_name: string;
}
export interface MemberExists {
    status: string;
    error: string;
}
/*=======================================================================================================
  홈 트레이닝 관련
=======================================================================================================*/
export interface WorkoutRecord {
  wor_id: string;
  wor_dt: Date;
  woo_id: string;
  woo_name: string;
  woo_name_color: string;
  wor_target_reps: number;
  wor_target_sets: number;
  wor_count_p: number;
  wor_count: number;
  wor_count_s: number;
  wor_point: number;
  wor_desc?: string;
}
export interface WorkoutHistory {
  wo_dt: string;
  status: string;
}
export interface WorkoutDetail {
  woo_id: string;
  woo_name: string;
  woo_guide: string;
  woo_img: string;
  wod_target_reps: number;
  wod_target_sets: number;
}
/*=======================================================================================================
  메뉴 관련
=======================================================================================================*/

export interface ChartData {
  columns: Record<string, any>;
  data: Record<string, any>;
}
/*=======================================================================================================
  우편번호 
=======================================================================================================*/
export interface Postcode {
  postcode: string;
  address: string;
  roadAddress: string;
}
/*=======================================================================================================
  카카오지도  
=======================================================================================================*/
export interface MapPosition {
  lat: number;
  lng: number;
}
export interface BusinessTypeResult {
  name: string;
  fullCategory: string;        // 전체: "음식점 > 한식 > 김밥"
  leafCategory: string;        // 최종 말단: "김밥"
  mainCategory: string;        // 메인: "음식점"
  subCategory: string;         // 중분류: "한식"
}
export interface ShopLocation {
  name: string;
  fullAddress: string;
  coords: { lat: number; lng: number };
  category: string;
  matchScore: number; // 일치도 점수 (0-100)
}
