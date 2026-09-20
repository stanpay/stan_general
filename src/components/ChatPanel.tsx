import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { CHAT_FAB_BOTTOM, CHAT_FAB_SIZE } from "@/lib/chatFab";
import { acquireChatViewportLock, releaseChatViewportLock } from "@/lib/chatViewportLock";
import {
  getVirtualKeyboard,
  getViewportKeyboardInsets,
  isNarrowViewport,
} from "@/lib/viewportInsets";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/contexts/AppLocaleContext";
import { CHAT_COPY } from "@/lib/chatCopy";

const CHAT_ORIGIN = "https://stan.lkim.me";
const CHAT_URL = `${CHAT_ORIGIN}/?embed=1`;
const PANEL_MAX_HEIGHT_PX = 680;

type ChatPanelProps = { open: boolean; onClose: () => void };
type PanelBox = { bottom: number; height: number };
/** null = 전체 화면(inset-0). 값 있으면 모바일 키보드만큼 축소 */
type BackdropBox = { top: number; bottom: number } | null;

const computePanelBox = (inputFocused: boolean): PanelBox => {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const baseBottom = (4 - 1.75 + 3.5 + 0.75) * rem + 30;
  // keyboardInset만 사용 — addressBar를 bottom·top에 중복 반영하면 과하게 줄어듦
  const { keyboardInset, keyboardOpen } = getViewportKeyboardInsets(inputFocused);
  const vvTop = Math.round(window.visualViewport?.offsetTop ?? 0);
  const bottom = keyboardOpen ? keyboardInset + 8 : baseBottom;
  const topGap = keyboardOpen ? Math.max(12, vvTop) : 12 + vvTop;
  return {
    bottom,
    height: Math.max(160, Math.min(PANEL_MAX_HEIGHT_PX, window.innerHeight - bottom - topGap)),
  };
};

/** 모바일: 포커스 시 키보드만큼 축소, 해제 시 전체 복구 (주소창 이중 보정 없음) */
const computeBackdropBox = (inputFocused: boolean): BackdropBox => {
  if (!inputFocused || !isNarrowViewport()) return null;
  const { keyboardInset, keyboardOpen } = getViewportKeyboardInsets(true);
  if (!keyboardOpen) return null;
  const vvTop = Math.round(window.visualViewport?.offsetTop ?? 0);
  return { top: vvTop, bottom: keyboardInset };
};

/** Load once on first open, then retain the iframe so drafts and streams survive closing. */
const ChatPanel = ({ open, onClose }: ChatPanelProps) => {
  const { locale } = useAppLocale();
  const copy = CHAT_COPY[locale];
  // Freeze the first URL: subsequent language changes use postMessage, preserving drafts.
  const initialUrl = useRef<string | null>(null);
  if (open && !initialUrl.current) initialUrl.current = `${CHAT_URL}&lang=${locale}`;
  const [hasOpened, setHasOpened] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const [panelBox, setPanelBox] = useState<PanelBox>({ bottom: 0, height: PANEL_MAX_HEIGHT_PX });
  const [backdropBox, setBackdropBox] = useState<BackdropBox>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const panelRef = useRef<HTMLSectionElement>(null);

  useEffect(() => {
    if (open) setHasOpened(true);
  }, [open]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== CHAT_ORIGIN || event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === "stan-chat:ready") {
        setReady(true);
        setFailed(false);
        frameRef.current?.contentWindow?.postMessage({ type: "stan-chat:config", locale }, CHAT_ORIGIN);
        frameRef.current?.contentWindow?.postMessage({ type: "stan-chat:visibility", visible: open }, CHAT_ORIGIN);
      } else if (open && event.data?.type === "stan-chat:close") {
        onClose();
      } else if (event.data?.type === "stan-chat:focus") {
        setInputFocused(open && event.data.focused === true);
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [open, onClose, locale]);

  useEffect(() => {
    if (ready) frameRef.current?.contentWindow?.postMessage({ type: "stan-chat:config", locale }, CHAT_ORIGIN);
  }, [locale, ready]);

  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage({ type: "stan-chat:visibility", visible: open }, CHAT_ORIGIN);
    if (!open) setInputFocused(false);
  }, [open, ready]);

  useEffect(() => {
    if (!hasOpened || ready) return;
    const timer = window.setTimeout(() => setFailed(true), 15000);
    return () => window.clearTimeout(timer);
  }, [hasOpened, ready, attempt]);

  useEffect(() => {
    if (!open) return;
    acquireChatViewportLock();
    // 패널 자체에 포커스 — 닫기(X)에 두면 열 때마다 동그란 포커스 링이 보인다.
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      releaseChatViewportLock();
      document.getElementById("chat-launcher")?.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  useLayoutEffect(() => {
    if (!open) {
      setBackdropBox(null);
      return;
    }
    const vk = getVirtualKeyboard();
    const previousOverlay = vk?.overlaysContent;
    if (vk) {
      try { vk.overlaysContent = true; } catch { /* Not supported by every browser. */ }
    }
    const apply = () => {
      setPanelBox(computePanelBox(inputFocused));
      setBackdropBox(computeBackdropBox(inputFocused));
    };
    apply();
    window.addEventListener("resize", apply);
    window.visualViewport?.addEventListener("resize", apply);
    window.visualViewport?.addEventListener("scroll", apply);
    vk?.addEventListener("geometrychange", apply);
    return () => {
      window.removeEventListener("resize", apply);
      window.visualViewport?.removeEventListener("resize", apply);
      window.visualViewport?.removeEventListener("scroll", apply);
      vk?.removeEventListener("geometrychange", apply);
      if (vk && previousOverlay !== undefined) {
        try { vk.overlaysContent = previousOverlay; } catch { /* Ignore unsupported setters. */ }
      }
    };
  }, [open, inputFocused]);

  if (!hasOpened && !open) return null;

  return (
    <>
      {open && (
        <button type="button" aria-label={copy.backdrop} tabIndex={-1}
          className="fixed inset-x-0 z-[55] bg-black/35"
          style={
            backdropBox
              ? { top: backdropBox.top, bottom: backdropBox.bottom }
              : { top: 0, bottom: 0 }
          }
          onClick={onClose} />
      )}
      <section
        ref={panelRef}
        id="stan-chat-panel"
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        tabIndex={-1}
        hidden={!open}
        className={cn(
          "fixed z-[60] flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl outline-none",
          "left-3 right-3 sm:left-auto sm:right-[1.5rem] sm:w-[min(440px,calc(100vw-1.5rem))]",
        )}
        style={{ display: open ? undefined : "none", bottom: panelBox.bottom || `calc(${CHAT_FAB_BOTTOM} + ${CHAT_FAB_SIZE} + 0.75rem)`, height: panelBox.height }}
      >
        <header className="flex shrink-0 items-center gap-2 bg-primary px-3 py-2 text-primary-foreground">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{copy.title}</p>
          <a href={CHAT_ORIGIN} target="_blank" rel="noopener noreferrer" aria-label={copy.newWindow}
            className="rounded-full p-1 outline-none hover:bg-primary-foreground/15 focus-visible:bg-primary-foreground/15"><ExternalLink className="h-4 w-4" /></a>
          <button type="button" aria-label={copy.close} onClick={onClose}
            className="rounded-full p-1 outline-none hover:bg-primary-foreground/15 focus-visible:bg-primary-foreground/15"><X className="h-4 w-4" /></button>
        </header>
        <div className="relative min-h-0 flex-1">
          <iframe key={attempt} ref={frameRef} src={initialUrl.current ?? CHAT_URL} title={copy.title}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="microphone https://stan.lkim.me; clipboard-write https://stan.lkim.me"
            className="block h-full w-full border-0 bg-background" onError={() => setFailed(true)} />
          {!ready && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background p-6 text-center text-sm" role="status">
              <p>{failed ? copy.failed : copy.loading}</p>
              {failed && <>
                <button type="button" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
                  onClick={() => { initialUrl.current = `${CHAT_URL}&lang=${locale}`; setFailed(false); setReady(false); setAttempt((n) => n + 1); }}>{copy.retry}</button>
                <a href={CHAT_ORIGIN} target="_blank" rel="noopener noreferrer" className="underline">{copy.newWindow}</a>
              </>}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default ChatPanel;
