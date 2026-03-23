export interface NavSubItem {
    id: string;
    title: string;
    href: string;
    description: string;
}
export interface NavItem {
    id: string;
    title: string;
    img: string;
    description: string;
    sub_menus: NavSubItem[];
}
export interface Invoice {
    id: string;
    inv_dt: Date;
    seller_id: string;
    seller_name: string;
    area_name: string;
    payment_status: string;
    payment_method: string;
    payment_status_color: string;
    payment_method_color: string;
    qty: number;
    price: number;
    amount: number;
}
export interface ColDesc {
    id: string;
    title: string;
    type: string;
    width?: number;
    summary?: string;
    aggregate?: number;
}
export interface InvoiceSummarySub {
    amount: number;
}
export interface InvoiceSummary {
    month: string;
    sub_amounts: InvoiceSummarySub[];
}
export interface MapPosition {
    lat: number;
    lng: number;
}
export interface Postcode {
    postcode: string;
    address: string;
    roadAddress: string;
}
export interface BusinessTypeResult {
    name: string;
    fullCategory: string;
    leafCategory: string;
    mainCategory: string;
    subCategory: string;
}
export interface ShopLocation {
    name: string;
    fullAddress: string;
    coords: {
        lat: number;
        lng: number;
    };
    category: string;
    matchScore: number;
}
