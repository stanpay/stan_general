/**
 * 매장 필터 칩 분류와 매칭 판정.
 *
 * Main.tsx가 4,000줄 규모라 필터 판정 로직을 분리했다. 칩 ID 타입도 함께 옮겨
 * Main.tsx가 이 모듈을 단방향으로 참조하도록 했다(반대로 두면 순환 참조가 된다).
 */
import type { AppLocale } from "@/lib/locale";

export type StoreFilterChipId =
  | "all"
  | "chilsungro"
  | "localCurrency"
  | "highOilSupport"
  | "restaurant"
  | "cafe"
  | "shopping"
  | "other";

export const BENEFIT_FILTER_CHIP_ORDER: StoreFilterChipId[] = [
  "all",
  "chilsungro",
  "localCurrency",
  "highOilSupport",
];

export const STORE_CATEGORY_CHIP_ORDER: StoreFilterChipId[] = [
  "all",
  "restaurant",
  "cafe",
  "shopping",
  "other",
];

/** 카테고리 테마(전체 제외) — 칩·지도 독립 핀 공통 */
export type StoreCategoryThemeId = "restaurant" | "cafe" | "shopping" | "other";

export type StoreCategoryThemeStyle = {
  /** 지도 핀 balloon/tail — 칩 idle 배경과 동일 톤 */
  hex: string;
  /** 지도 핀 라벨 — 칩 텍스트와 동일 톤 */
  labelHex: string;
  /** 지도 핀 테두리 */
  borderHex: string;
  /** 칩 비선택 */
  chipIdle: string;
  /** 칩 선택 */
  chipActive: string;
};

/** Tailwind — idle은 연한 아웃라인 유지, active는 테두리 두껍게·글자·테두리만 진하게 */
export const STORE_CATEGORY_THEME: Record<StoreCategoryThemeId, StoreCategoryThemeStyle> = {
  restaurant: {
    hex: "#ffe4e6", // rose-100
    labelHex: "#f43f5e", // rose-500 — 빨강만 글씨 세기 살짝 낮춤
    borderHex: "#fda4af", // rose-300
    chipIdle: "border-rose-300 bg-card text-rose-600 hover:bg-rose-50",
    chipActive: "border-2 border-rose-700 bg-card text-rose-800 hover:bg-rose-50",
  },
  cafe: {
    hex: "#fef3c7", // amber-100
    labelHex: "#d97706", // amber-600
    borderHex: "#fcd34d", // amber-300
    chipIdle: "border-amber-300 bg-card text-amber-700 hover:bg-amber-50",
    chipActive: "border-2 border-amber-700 bg-card text-amber-900 hover:bg-amber-50",
  },
  shopping: {
    hex: "#d1fae5", // emerald-100
    labelHex: "#059669", // emerald-600
    borderHex: "#6ee7b7", // emerald-300
    chipIdle: "border-emerald-300 bg-card text-emerald-700 hover:bg-emerald-50",
    chipActive: "border-2 border-emerald-700 bg-card text-emerald-900 hover:bg-emerald-50",
  },
  other: {
    hex: "#f1f5f9", // slate-100
    labelHex: "#475569", // slate-600
    borderHex: "#cbd5e1", // slate-300
    chipIdle: "border-slate-300 bg-card text-slate-600 hover:bg-slate-50",
    chipActive: "border-2 border-slate-700 bg-card text-slate-900 hover:bg-slate-50",
  },
};

/** 클러스터·폴백 핀 기본색 (기존 지도 파랑) */
export const MAP_PIN_DEFAULT_HEX = "#2D8CFF";
export const MAP_PIN_SELECTED_HEX = "#ea580c";

export type StoreAreaFilterChipId =
  | "all"
  | "areaChilsungro"
  | "areaJungangro"
  | "areaUndergroundMall";

export const STORE_AREA_FILTER_CHIP_ORDER: StoreAreaFilterChipId[] = [
  "all",
  "areaChilsungro",
  "areaJungangro",
  "areaUndergroundMall",
];

export type LegacyBenefitFilterChipId = StoreFilterChipId | "openNow";

export const LEGACY_BENEFIT_FILTER_CHIP_ORDER: LegacyBenefitFilterChipId[] = [
  "all",
  "chilsungro",
  "localCurrency",
  "highOilSupport",
  "openNow",
];

export type StoreLikeForChip = {
  image: string;
  categoryGroupCode?: string;
  categoryName?: string;
  area?: string | null;
  local_currency_available?: boolean;
  high_oil_support_available?: boolean;
  hasTravelConsumerCoupon?: boolean;
};

function storeHasHighOilSupport(store: StoreLikeForChip): boolean {
  return store.high_oil_support_available === true;
}

function storeChipIsCafe(store: StoreLikeForChip): boolean {
  if (store.categoryGroupCode === "CE7") return true;
  const cafeImages = new Set(["starbucks", "mega", "pascucci", "twosome", "baskin"]);
  if (cafeImages.has(store.image)) return true;
  if (store.image === "cafe") return true;
  return false;
}

function storeChipIsRestaurant(store: StoreLikeForChip): boolean {
  if (storeChipIsCafe(store)) return false;
  if (store.image === "restaurant") return true;
  if (store.categoryGroupCode === "FD6") return true;
  return false;
}

function storeChipIsShopping(store: StoreLikeForChip): boolean {
  if (["MT1", "CS2"].includes(store.categoryGroupCode || "")) return true;
  if (store.image === "shopping") return true;
  return false;
}

function storeHasChilsungroCoupon(store: StoreLikeForChip): boolean {
  return store.hasTravelConsumerCoupon === true;
}

export function imageFromStoreCategory(category?: string | null): string {
  if (!category) return "other";
  if (category.includes("카페") || category.includes("디저트")) return "cafe";
  if (category.includes("쇼핑")) return "shopping";
  if (category.includes("음식")) return "restaurant";
  return "other";
}

export function categoryGroupCodeFromStoreCategory(category?: string | null): string {
  if (!category) return "";
  if (category.includes("카페") || category.includes("디저트")) return "CE7";
  if (category.includes("쇼핑")) return "MT1";
  if (category.includes("음식")) return "FD6";
  return "";
}

function storeChipIsOther(store: StoreLikeForChip): boolean {
  return (
    !storeChipIsRestaurant(store) &&
    !storeChipIsCafe(store) &&
    !storeChipIsShopping(store)
  );
}

/** 매장의 카테고리 테마 ID (칩·핀 색 공통) */
export function getStoreCategoryThemeId(store: StoreLikeForChip): StoreCategoryThemeId {
  if (storeChipIsCafe(store)) return "cafe";
  if (storeChipIsRestaurant(store)) return "restaurant";
  if (storeChipIsShopping(store)) return "shopping";
  return "other";
}

export function getStoreCategoryThemeHex(store: StoreLikeForChip): string {
  return STORE_CATEGORY_THEME[getStoreCategoryThemeId(store)].hex;
}

export function getStoreCategoryTheme(store: StoreLikeForChip): StoreCategoryThemeStyle {
  return STORE_CATEGORY_THEME[getStoreCategoryThemeId(store)];
}

export function storeMatchesBenefitChipFilters(
  store: StoreLikeForChip,
  chips: ReadonlySet<LegacyBenefitFilterChipId>,
  locale: AppLocale
): boolean {
  // openNow는 영업 여부 필터에서 따로 처리하므로 여기서는 제외
  if (chips.has("all")) return true;

  const parts: boolean[] = [];
  if (chips.has("chilsungro")) parts.push(storeHasChilsungroCoupon(store));
  if (chips.has("localCurrency")) parts.push(!!store.local_currency_available);
  if (locale === "ko" && chips.has("highOilSupport")) {
    parts.push(storeHasHighOilSupport(store));
  }

  return parts.length > 0 && parts.some(Boolean);
}

export function storeMatchesAreaChipFilters(
  store: StoreLikeForChip,
  chips: ReadonlySet<StoreAreaFilterChipId>
): boolean {
  if (chips.has("all")) return true;

  const parts: boolean[] = [];
  if (chips.has("areaChilsungro")) parts.push(store.area === "칠성로");
  if (chips.has("areaJungangro")) parts.push(store.area === "중앙로");
  if (chips.has("areaUndergroundMall")) parts.push(store.area === "지하상가");

  return parts.length > 0 && parts.some(Boolean);
}

export function storeMatchesCategoryChipFilters(
  store: StoreLikeForChip,
  chips: ReadonlySet<StoreFilterChipId>
): boolean {
  if (chips.has("all")) return true;

  const parts: boolean[] = [];
  if (chips.has("restaurant")) parts.push(storeChipIsRestaurant(store));
  if (chips.has("cafe")) parts.push(storeChipIsCafe(store));
  if (chips.has("shopping")) parts.push(storeChipIsShopping(store));
  if (chips.has("other")) parts.push(storeChipIsOther(store));

  return parts.length > 0 && parts.some(Boolean);
}

/** 현재 선택된 칩 3종 */
export type StoreChipSelection = {
  area: ReadonlySet<StoreAreaFilterChipId>;
  benefit: ReadonlySet<LegacyBenefitFilterChipId>;
  category: ReadonlySet<StoreFilterChipId>;
};

/**
 * 구역·혜택·카테고리 칩을 모두 만족하는가.
 * 같은 조합이 목록 memo와 지도 재검색에 각각 구현돼 있어 하나로 모았다.
 */
export function storeMatchesAllChipFilters(
  store: StoreLikeForChip,
  chips: StoreChipSelection,
  locale: AppLocale,
): boolean {
  return (
    storeMatchesAreaChipFilters(store, chips.area) &&
    storeMatchesBenefitChipFilters(store, chips.benefit, locale) &&
    storeMatchesCategoryChipFilters(store, chips.category)
  );
}

/** 매장명 부분 일치 검색. 빈 질의면 원본을 그대로 돌려준다. */
export function filterStoresByName<T extends { name: string }>(
  stores: T[],
  query: string,
): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return stores;
  return stores.filter((store) => store.name.toLowerCase().includes(normalized));
}
