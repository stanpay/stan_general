/**
 * 매장 필터 칩 상태.
 *
 * Main.tsx 분해 4단계. 혜택·카테고리(및 데모용 구역) 선택 상태와 토글 규칙,
 * 로케일에 따른 노출 순서를 한곳에 모았다. 파생 목록 계산은 호출부에 남겨
 * 이 훅은 "무엇이 선택됐는가"만 책임진다.
 */
import { useEffect, useMemo, useState } from "react";
import type { AppLocale } from "@/lib/locale";
import {
  LEGACY_BENEFIT_FILTER_CHIP_ORDER,
  type LegacyBenefitFilterChipId,
  type StoreAreaFilterChipId,
  type StoreFilterChipId,
} from "@/lib/storeFilters";

const OPEN_NOW_STORAGE_KEY = "storeFilter:openNow";

/** 저장된 값이 없으면 기본 ON (기존 동작과 동일) */
function readOpenNowPreference(): boolean {
  try {
    const raw = localStorage.getItem(OPEN_NOW_STORAGE_KEY);
    if (raw === null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

function writeOpenNowPreference(on: boolean): void {
  try {
    localStorage.setItem(OPEN_NOW_STORAGE_KEY, String(on));
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * 칩 선택 토글 규칙.
 * "all"은 단독 선택이고, 나머지는 다중 선택이며, 모두 해제되면 "all"로 돌아간다.
 * 구역·카테고리·(openNow를 제외한) 혜택 칩이 같은 규칙을 쓴다.
 */
function toggleChipSelection<T extends string>(
  prev: ReadonlySet<T>,
  id: T,
  allId: T,
): Set<T> {
  if (id === allId) return new Set<T>([allId]);

  const next = new Set(prev);
  next.delete(allId);
  if (next.has(id)) next.delete(id);
  else next.add(id);

  if (next.size === 0) next.add(allId);
  return next;
}

type UseStoreFiltersOptions = {
  locale: AppLocale;
};

export function useStoreFilters({ locale }: UseStoreFiltersOptions) {
  const [benefitFilterChips, setBenefitFilterChips] = useState<Set<LegacyBenefitFilterChipId>>(
    () => {
      const chips = new Set<LegacyBenefitFilterChipId>(["all"]);
      if (readOpenNowPreference()) chips.add("openNow");
      return chips;
    }
  );
  const [areaFilterChips, setAreaFilterChips] = useState<Set<StoreAreaFilterChipId>>(
    () => new Set<StoreAreaFilterChipId>(["all"])
  );
  const [categoryFilterChips, setCategoryFilterChips] = useState<Set<StoreFilterChipId>>(
    () => new Set<StoreFilterChipId>(["all"])
  );

  useEffect(() => {
    writeOpenNowPreference(benefitFilterChips.has("openNow"));
  }, [benefitFilterChips]);

  useEffect(() => {
    if (locale === "ko") return;
    setBenefitFilterChips((prev) => {
      if (!prev.has("highOilSupport")) return prev;
      const next = new Set(prev);
      next.delete("highOilSupport");
      return next;
    });
  }, [locale]);

  /** 기본 2줄 칩 UI: 혜택 줄에 openNow 포함 (6월 초 형태) */
  const benefitFilterChipOrder = useMemo((): readonly LegacyBenefitFilterChipId[] => {
    return locale === "ko"
      ? LEGACY_BENEFIT_FILTER_CHIP_ORDER
      : LEGACY_BENEFIT_FILTER_CHIP_ORDER.filter((id) => id !== "highOilSupport");
  }, [locale]);

  const toggleAreaFilter = (id: StoreAreaFilterChipId) => {
    setAreaFilterChips((prev) => toggleChipSelection(prev, id, "all"));
  };

  const toggleBenefitFilter = (id: LegacyBenefitFilterChipId) => {
    setBenefitFilterChips((prev) => {
      const next = new Set(prev);

      // 영업중은 혜택 칩들과 별도로 토글한다.
      if (id === "openNow") {
        if (next.has("openNow")) next.delete("openNow");
        else next.add("openNow");
        return next;
      }

      if (id === "all") {
        const hasOpenNow = next.has("openNow");
        next.clear();
        next.add("all");
        if (hasOpenNow) next.add("openNow");
        return next;
      }

      next.delete("all");
      if (next.has(id)) next.delete(id);
      else next.add(id);

      const selectedBenefitChips = new Set([...next].filter((c) => c !== "openNow"));
      if (selectedBenefitChips.size === 0) next.add("all");

      return next;
    });
  };

  const toggleCategoryFilter = (id: StoreFilterChipId) => {
    setCategoryFilterChips((prev) => toggleChipSelection(prev, id, "all"));
  };

  return {
    benefitFilterChips,
    setBenefitFilterChips,
    areaFilterChips,
    setAreaFilterChips,
    categoryFilterChips,
    setCategoryFilterChips,
    benefitFilterChipOrder,
    toggleAreaFilter,
    toggleBenefitFilter,
    toggleCategoryFilter,
  };
}
