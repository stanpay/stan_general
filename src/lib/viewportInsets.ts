import { isInStandaloneMode } from "@/lib/pwa";

type VirtualKeyboardLike = {
  overlaysContent: boolean;
  boundingRect: { height: number };
  addEventListener: (type: "geometrychange", listener: () => void) => void;
  removeEventListener: (type: "geometrychange", listener: () => void) => void;
};

export const KEYBOARD_OPEN_THRESHOLD_PX = 80;
/** overlays-content 에서 viewport가 안 줄 때 쓰는 추정 키보드 비율 */
export const KEYBOARD_ESTIMATE_RATIO = 0.42;
/** Chrome/Safari 모바일 주소창 대략 높이 (측정 실패 시) */
export const DEFAULT_BROWSER_ADDRESS_BAR_PX = 56;

export function getVirtualKeyboard(): VirtualKeyboardLike | undefined {
  return (navigator as Navigator & { virtualKeyboard?: VirtualKeyboardLike })
    .virtualKeyboard;
}

export function isNarrowViewport(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 639px)").matches
  );
}

/** 소프트 키보드가 가리는 하단 inset (px) */
export function getSoftKeyboardInsetPx(inputFocused: boolean): number {
  if (typeof window === "undefined") return 0;

  const vv = window.visualViewport;
  const layoutH = window.innerHeight;
  const vvH = vv?.height ?? layoutH;
  const vvTop = vv?.offsetTop ?? 0;

  const vkHeight = Math.round(getVirtualKeyboard()?.boundingRect?.height ?? 0);
  const vvInset = Math.max(0, Math.round(layoutH - (vvTop + vvH)));
  let keyboardInset = Math.max(vkHeight, vvInset);

  // Chrome + interactive-widget=overlays-content: viewport가 안 줄어듦 → 포커스 시 추정
  if (keyboardInset < KEYBOARD_OPEN_THRESHOLD_PX && inputFocused && isNarrowViewport()) {
    keyboardInset = Math.round(layoutH * KEYBOARD_ESTIMATE_RATIO);
  }

  return keyboardInset;
}

/**
 * 비-PWA(일반 웹)에서 키보드가 열릴 때 주소창이 다시 펼쳐지며
 * 콘텐츠가 키보드와 겹치는 만큼의 보정 높이.
 * PWA(standalone 등)에서는 주소창이 없으므로 0.
 */
export function getBrowserAddressBarInsetPx(keyboardOpen: boolean): number {
  if (typeof window === "undefined" || !keyboardOpen) return 0;
  if (isInStandaloneMode()) return 0;

  const vv = window.visualViewport;
  const vvTop = Math.round(vv?.offsetTop ?? 0);
  // iOS 등: visualViewport.offsetTop 이 툴바/주소창 영역을 반영
  if (vvTop >= 24) return vvTop;

  const layoutH = window.innerHeight;
  const outerGap = Math.round(window.outerHeight - layoutH);
  // 키보드가 열린 뒤 outerGap 이 비정상적으로 커질 수 있어 상한 클램프
  if (outerGap >= 24 && outerGap <= 120) return outerGap;

  return DEFAULT_BROWSER_ADDRESS_BAR_PX;
}

export type ViewportKeyboardInsets = {
  keyboardInset: number;
  addressBarInset: number;
  /** 하단 fixed UI를 올릴 양 = keyboard + (웹일 때 addressBar) */
  bottomInset: number;
  /** 상단 sticky/fixed UI 보정 (검색 헤더 등) */
  topInset: number;
  keyboardOpen: boolean;
};

/**
 * 모바일 입력 포커스 시 키보드(+ 웹 주소창) inset.
 * - PWA: 키보드만
 * - 웹사이트: 키보드 + 주소창 (주소창만큼 키보드와 겹치는 현상 보정)
 */
export function getViewportKeyboardInsets(
  inputFocused: boolean
): ViewportKeyboardInsets {
  if (typeof window === "undefined") {
    return {
      keyboardInset: 0,
      addressBarInset: 0,
      bottomInset: 0,
      topInset: 0,
      keyboardOpen: false,
    };
  }

  const keyboardInset = getSoftKeyboardInsetPx(inputFocused);
  const keyboardOpen = keyboardInset >= KEYBOARD_OPEN_THRESHOLD_PX;
  const addressBarInset = getBrowserAddressBarInsetPx(keyboardOpen);
  const vvTop = Math.round(window.visualViewport?.offsetTop ?? 0);

  // 웹: 주소창이 펼쳐진 만큼 상·하단 모두 보정. PWA: vv.offsetTop만.
  const topInset = keyboardOpen
    ? Math.max(vvTop, addressBarInset)
    : vvTop;

  return {
    keyboardInset,
    addressBarInset,
    bottomInset: keyboardOpen ? keyboardInset + addressBarInset : 0,
    topInset,
    keyboardOpen,
  };
}
