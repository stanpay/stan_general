import { useEffect, useState } from "react";
import type { AppLocale } from "@/lib/locale";
import { isStoredKoreanSystemLocation, resolveLocationDisplay } from "@/lib/locale";
import {
  normalizeKoreanText,
  peekCachedKoTranslation,
  translateKoText,
} from "@/lib/koTranslate";

const HANGUL = /[가-힣]/;
const KOREAN_LOCALITY_SUFFIX = /(동|읍|면)$/;

function trimAddressToLocality(address: string): string {
  const parts = address.trim().split(/\s+/);
  const localityIndex = parts.findIndex((part) => KOREAN_LOCALITY_SUFFIX.test(part));
  if (localityIndex === -1) return address;
  return parts.slice(0, localityIndex + 1).join(" ");
}

function initialTranslatedText(source: string, locale: AppLocale): string {
  const normalized = normalizeKoreanText(source);
  if (locale === "ko" || !HANGUL.test(normalized)) return normalized;
  return peekCachedKoTranslation(normalized, locale) ?? normalized;
}

/** 매장명 등 일반 한국어 문장 */
export function useTranslatedKoreanText(source: string, locale: AppLocale): string {
  const normalized = normalizeKoreanText(source);
  const [out, setOut] = useState(() => initialTranslatedText(source, locale));

  useEffect(() => {
    if (locale === "ko" || !HANGUL.test(normalized)) {
      setOut(normalized);
      return;
    }
    const cached = peekCachedKoTranslation(normalized, locale);
    if (cached) {
      setOut(cached);
      return;
    }
    setOut(normalized);
    let cancelled = false;
    translateKoText(normalized, locale).then((t) => {
      if (!cancelled) setOut(t);
    });
    return () => {
      cancelled = true;
    };
  }, [normalized, locale]);

  return out;
}

/** 헤더 주소: 시스템 문구는 로케일 사전, 실제 주소는 기계번역 */
export function useTranslatedAddressLine(currentLocation: string, locale: AppLocale): string {
  const system = isStoredKoreanSystemLocation(currentLocation);
  const displayLocation = system
    ? currentLocation
    : normalizeKoreanText(trimAddressToLocality(currentLocation));

  const [out, setOut] = useState(() => {
    if (system || locale === "ko") {
      return system
        ? resolveLocationDisplay(locale, currentLocation)
        : displayLocation;
    }
    if (!HANGUL.test(displayLocation)) return displayLocation;
    return (
      peekCachedKoTranslation(displayLocation, locale) ?? displayLocation
    );
  });

  useEffect(() => {
    if (system || locale === "ko") {
      setOut(
        system
          ? resolveLocationDisplay(locale, currentLocation)
          : displayLocation
      );
      return;
    }
    if (!HANGUL.test(displayLocation)) {
      setOut(displayLocation);
      return;
    }
    const cached = peekCachedKoTranslation(displayLocation, locale);
    if (cached) {
      setOut(cached);
      return;
    }
    setOut(displayLocation);
    let cancelled = false;
    translateKoText(displayLocation, locale).then((t) => {
      if (!cancelled) setOut(t);
    });
    return () => {
      cancelled = true;
    };
  }, [currentLocation, displayLocation, locale, system]);

  return out;
}
