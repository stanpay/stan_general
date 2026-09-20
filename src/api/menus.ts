import { supabase } from "@/lib/supabase";
import { normalizeStoreName } from "@/lib/menuBoardStores";
import type { AppLocale } from "@/lib/locale";
import { storeMenuStrings } from "@/lib/locale";

/** 국내 식품 알레르기 표시 대상 (menus.allergen_* 컬럼) */
export const ALLERGEN_FIELDS = [
  { key: "allergen_egg", localeKey: "egg" },
  { key: "allergen_milk", localeKey: "milk" },
  { key: "allergen_buckwheat", localeKey: "buckwheat" },
  { key: "allergen_peanut", localeKey: "peanut" },
  { key: "allergen_soy", localeKey: "soy" },
  { key: "allergen_wheat", localeKey: "wheat" },
  { key: "allergen_mackerel", localeKey: "mackerel" },
  { key: "allergen_crab", localeKey: "crab" },
  { key: "allergen_shrimp", localeKey: "shrimp" },
  { key: "allergen_pork", localeKey: "pork" },
  { key: "allergen_peach", localeKey: "peach" },
  { key: "allergen_tomato", localeKey: "tomato" },
  { key: "allergen_sulfite", localeKey: "sulfite" },
  { key: "allergen_walnut", localeKey: "walnut" },
  { key: "allergen_chicken", localeKey: "chicken" },
  { key: "allergen_beef", localeKey: "beef" },
  { key: "allergen_squid", localeKey: "squid" },
  { key: "allergen_shellfish", localeKey: "shellfish" },
  { key: "allergen_pine_nut", localeKey: "pineNut" },
] as const;

export type AllergenKey = (typeof ALLERGEN_FIELDS)[number]["key"];

export type MenuItem = {
  id: number;
  store_name: string;
  menu_name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_food: boolean | null;
} & Partial<Record<AllergenKey, boolean | null>>;

const MENU_SELECT =
  "id, store_name, menu_name, description, price, image_url, is_food, " +
  ALLERGEN_FIELDS.map((f) => f.key).join(", ");

export function getMenuAllergenLabels(
  item: MenuItem,
  locale: AppLocale,
): string[] {
  const labels = storeMenuStrings(locale).allergens;
  return ALLERGEN_FIELDS.filter((f) => item[f.key] === true).map(
    (f) => labels[f.localeKey],
  );
}

export async function fetchMenusByStoreName(
  storeName: string,
): Promise<MenuItem[]> {
  const name = normalizeStoreName(storeName);

  const { data, error } = await supabase
    .from("menus")
    .select(MENU_SELECT)
    .eq("store_name", name)
    .order("id", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown as MenuItem[]) ?? [];
}
