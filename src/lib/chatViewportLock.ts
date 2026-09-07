/** 채팅 열림 중 레이아웃 뷰포트 스크롤 잠금 (주소창 펼침/화면 밀림 완화) */

type SavedStyles = {
  htmlOverflow: string;
  htmlOverscroll: string;
  htmlHeight: string;
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyWidth: string;
  bodyHeight: string;
  bodyOverflow: string;
  bodyOverscroll: string;
};

let locked = false;
let savedScrollY = 0;
let saved: SavedStyles | null = null;

/** 이미 잠겨 있으면 no-op. FAB pointerdown에서 선잠금 가능. */
export const acquireChatViewportLock = () => {
  if (typeof document === "undefined" || locked) return;

  const html = document.documentElement;
  const body = document.body;
  savedScrollY = window.scrollY;
  saved = {
    htmlOverflow: html.style.overflow,
    htmlOverscroll: html.style.overscrollBehavior,
    htmlHeight: html.style.height,
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyLeft: body.style.left,
    bodyWidth: body.style.width,
    bodyHeight: body.style.height,
    bodyOverflow: body.style.overflow,
    bodyOverscroll: body.style.overscrollBehavior,
  };

  // html 은 position:fixed 하지 않음 — Chrome에서 뷰포트 점프 유발
  html.style.overflow = "hidden";
  html.style.overscrollBehavior = "none";
  html.style.height = "100%";
  html.classList.add("chat-viewport-locked");

  body.style.position = "fixed";
  body.style.top = `-${savedScrollY}px`;
  body.style.left = "0";
  body.style.width = "100%";
  body.style.height = "100%";
  body.style.overflow = "hidden";
  body.style.overscrollBehavior = "none";

  locked = true;
  window.scrollTo(0, 0);
};

export const releaseChatViewportLock = () => {
  if (typeof document === "undefined" || !locked || !saved) return;

  const html = document.documentElement;
  const body = document.body;
  const y = savedScrollY;

  html.style.overflow = saved.htmlOverflow;
  html.style.overscrollBehavior = saved.htmlOverscroll;
  html.style.height = saved.htmlHeight;
  html.classList.remove("chat-viewport-locked");

  body.style.position = saved.bodyPosition;
  body.style.top = saved.bodyTop;
  body.style.left = saved.bodyLeft;
  body.style.width = saved.bodyWidth;
  body.style.height = saved.bodyHeight;
  body.style.overflow = saved.bodyOverflow;
  body.style.overscrollBehavior = saved.bodyOverscroll;

  saved = null;
  locked = false;
  window.scrollTo(0, y);
};

export const isChatViewportLocked = () => locked;
