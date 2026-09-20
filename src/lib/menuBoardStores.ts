/** 메뉴판 페이지로 여는 매장명 (downtown_stores.name / menus.store_name 기준) */
export const MENU_BOARD_STORE_NAMES = [
  "녹다(NOKDA)",
  "농업회사법인주식회사 이시보",
  "마이콩(MyKong)",
  "미더(MITHE)",
  "밈디자인",
  "아일랜드토모라(ISLANDTOMORA)",
  "오효",
  "커스티(CURSTI)",
  "핏플(FITPLE)",
  "하이벨라(HIVELLA)",
  "헤미지(Hemiji)",
] as const;

/**
 * 메뉴판 대상 매장 공통 위치 (제주 관덕로11길 34 — downtown_stores / redirect 동일)
 * redirect → https://naver.me/5Q3V9dWs → place/1899730009
 */
export const MENU_BOARD_MAP = {
  lat: 33.5159497,
  lon: 126.5257996,
  placeId: "1899730009",
  webUrl: "https://naver.me/5Q3V9dWs",
} as const;

const MENU_BOARD_STORE_NAME_SET = new Set(
  MENU_BOARD_STORE_NAMES.map((name) => name.normalize("NFC")),
);

/** nearby API 등 NFD 한글도 동일 매장으로 인식 */
export function normalizeStoreName(name: string): string {
  return name.normalize("NFC").trim();
}

export function isMenuBoardStore(name: string | undefined | null): boolean {
  if (!name) return false;
  return MENU_BOARD_STORE_NAME_SET.has(normalizeStoreName(name));
}

export function menuBoardPath(name: string): string {
  return `/menu/${encodeURIComponent(normalizeStoreName(name))}`;
}
