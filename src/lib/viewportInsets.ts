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

  const vk = getVirtualKeyboard();
  const vkHeight = Math.round(vk?.boundingRect?.height ?? 0);
  const vvInset = Math.max(0, Math.round(layoutH - (vvTop + vvH)));
  let keyboardInset = Math.max(vkHeight, vvInset);

  // overlays-content 일 때만 포커스 추정. resizes-visual 에서는 실측만 쓰고,
  // 포커스만으로 추정하면 뒤로가기로 키보드만 닫혀도 축소가 남는다.
  const overlays = vk?.overlaysContent === true;
  if (
    overlays &&
    keyboardInset < KEYBOARD_OPEN_THRESHOLD_PX &&
    inputFocused &&
    isNarrowViewport()
  ) {
    keyboardInset = Math.round(layoutH * KEYBOARD_ESTIMATE_RATIO);
  }

  return keyboardInset;
}

/**
 * 비-PWA(일반 웹)에서 키보드가 열릴 때 주소창이 펼쳐진 실측 높이.
 * visualViewport.offsetTop 등으로 측정되지 않으면 0 — 추정값(56 등)을
 * 넣으면 sticky 헤더가 허공에 떠 배너가 비치는 부작용이 난다.
 * PWA(standalone 등)에서는 주소창이 없으므로 0.
 */
export function getBrowserAddressBarInsetPx(keyboardOpen: boolean): number {
  if (typeof window === "undefined" || !keyboardOpen) return 0;
  if (isInStandaloneMode()) return 0;

  const vv = window.visualViewport;
  const vvTop = Math.round(vv?.offsetTop ?? 0);
  // iOS 등: visualViewport.offsetTop 이 툴바/주소창 영역을 반영
  if (vvTop >= 24) return vvTop;

  return 0;
}

export type ViewportKeyboardInsets = {
  keyboardInset: number;
  addressBarInset: number;
  /** 하단 fixed UI를 올릴 양 (소프트 키보드) */
  bottomInset: number;
  /** 상단 sticky/fixed UI 보정 — 실측 visualViewport.offsetTop 만 */
  topInset: number;
  keyboardOpen: boolean;
};

/**
 * 모바일 입력 포커스 시 키보드·상단 inset.
 * - topInset: visualViewport.offsetTop 실측만 (추정 주소창 높이 사용 안 함)
 * - bottomInset: 소프트 키보드만 (주소창을 하단에도 더하면 과보정)
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

  return {
    keyboardInset,
    addressBarInset,
    bottomInset: keyboardOpen ? keyboardInset : 0,
    topInset: vvTop,
    keyboardOpen,
  };
}
