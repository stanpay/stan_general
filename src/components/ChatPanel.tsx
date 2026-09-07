import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import {
  DUMMY_CHAT_AGENT_NAME,
  DUMMY_CHAT_BOT_REPLIES,
  DUMMY_CHAT_EMPTY_HINT,
  DUMMY_CHAT_HEADER_SUBTITLE,
  DUMMY_CHAT_HEADER_TITLE,
  DUMMY_CHAT_MESSAGES,
  DUMMY_CHAT_PLACEHOLDER,
  DUMMY_CHAT_REPLY_DELAY_MS,
  type DummyChatMessage,
} from "@/lib/chatDummyData";
import { CHAT_FAB_BOTTOM, CHAT_FAB_SIZE } from "@/lib/chatFab";
import {
  getVirtualKeyboard,
  getViewportKeyboardInsets,
  isNarrowViewport,
} from "@/lib/viewportInsets";
import { cn } from "@/lib/utils";

type ChatPanelProps = {
  open: boolean;
  onClose: () => void;
};

type PanelBox = {
  bottom: number;
  height: number;
};

const PANEL_MAX_HEIGHT_PX = 560;
const PANEL_TOP_GAP_PX = 12;
const KEYBOARD_GAP_PX = 8;

const panelBaseBottomPx = () => {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return (4 - 1.75 + 3.5 + 0.75) * rem + 30;
};

const formatTime = (iso: string) => {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
};

const TypingBubble = () => (
  <div className="flex max-w-[85%] flex-col gap-1 self-start items-start">
    <span className="px-1 text-[11px] text-muted-foreground">
      {DUMMY_CHAT_AGENT_NAME}
    </span>
    <div
      aria-label="응답 작성 중"
      className="rounded-2xl rounded-bl-md bg-background px-3.5 py-3 text-sm shadow-sm"
    >
      <span className="inline-flex items-center gap-1">
        <span className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
        <span className="chat-typing-dot chat-typing-dot-delay-1 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
        <span className="chat-typing-dot chat-typing-dot-delay-2 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      </span>
    </div>
  </div>
);

const computePanelBox = (inputFocused: boolean): PanelBox => {
  const layoutH = window.innerHeight;
  const baseBottom = panelBaseBottomPx();
  const { bottomInset, topInset, keyboardOpen } =
    getViewportKeyboardInsets(inputFocused);

  // PWA: bottomInset = keyboard only / 웹: keyboard + addressBar
  const bottom = keyboardOpen ? bottomInset + KEYBOARD_GAP_PX : baseBottom;

  const height = Math.max(
    160,
    Math.min(PANEL_MAX_HEIGHT_PX, layoutH - bottom - PANEL_TOP_GAP_PX - topInset)
  );

  return { bottom, height };
};

const ChatPanel = ({ open, onClose }: ChatPanelProps) => {
  const [messages, setMessages] = useState<DummyChatMessage[]>(DUMMY_CHAT_MESSAGES);
  const [draft, setDraft] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [panelBox, setPanelBox] = useState<PanelBox>({
    bottom: 0,
    height: PANEL_MAX_HEIGHT_PX,
  });
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const replyTimerRef = useRef<number | null>(null);
  const replyIndexRef = useRef(0);
  const inputFocusedRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, messages, isBotTyping]);

  // 데스크톱만 자동 포커스. 모바일 autofocus는 키보드+주소창을 바로 띄움
  useEffect(() => {
    if (!open) return;
    if (isNarrowViewport()) return;
    const id = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 120);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.width = prev.bodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      inputFocusedRef.current = false;
      setInputFocused(false);
      return;
    }

    const vk = getVirtualKeyboard();
    if (vk) {
      try {
        vk.overlaysContent = true;
      } catch {
        // ignore
      }
    }

    const apply = () => {
      const next = computePanelBox(inputFocusedRef.current);
      setPanelBox(next);
      const el = panelRef.current;
      if (el) {
        el.style.bottom = `${next.bottom}px`;
        el.style.height = `${next.height}px`;
        el.style.maxHeight = `${next.height}px`;
      }
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
    };
  }, [open, inputFocused]);

  useEffect(() => {
    return () => {
      if (replyTimerRef.current != null) {
        window.clearTimeout(replyTimerRef.current);
      }
    };
  }, []);

  const sendDraft = () => {
    const content = draft.trim();
    if (!content || isBotTyping) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        sender: "visitor",
        content,
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft("");
    setIsBotTyping(true);

    if (replyTimerRef.current != null) {
      window.clearTimeout(replyTimerRef.current);
    }

    replyTimerRef.current = window.setTimeout(() => {
      const reply =
        DUMMY_CHAT_BOT_REPLIES[
          replyIndexRef.current % DUMMY_CHAT_BOT_REPLIES.length
        ];
      replyIndexRef.current += 1;
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "agent",
          content: reply,
          createdAt: new Date().toISOString(),
        },
      ]);
      setIsBotTyping(false);
      replyTimerRef.current = null;
    }, DUMMY_CHAT_REPLY_DELAY_MS);
  };

  if (!open) return null;

  const bottomStyle =
    panelBox.bottom > 0
      ? panelBox.bottom
      : (`calc(${CHAT_FAB_BOTTOM} + ${CHAT_FAB_SIZE} + 0.75rem)` as const);

  return (
    <>
      <button
        type="button"
        aria-label="채팅 배경 닫기"
        className="fixed inset-0 z-[55] bg-black/35"
        onClick={onClose}
      />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={DUMMY_CHAT_HEADER_TITLE}
        className={cn(
          "fixed z-[60] flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl",
          "left-3 right-3",
          "sm:left-auto sm:right-[1.5rem] sm:w-[min(380px,calc(100vw-1.5rem))]"
        )}
        style={{
          bottom: bottomStyle,
          height: panelBox.height,
          maxHeight: panelBox.height,
        }}
      >
        <header className="flex shrink-0 items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 text-sm font-semibold">
            {DUMMY_CHAT_AGENT_NAME.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">
              {DUMMY_CHAT_HEADER_TITLE}
            </p>
            <p className="truncate text-xs text-primary-foreground/80">
              {DUMMY_CHAT_HEADER_SUBTITLE}
            </p>
          </div>
          <button
            type="button"
            aria-label="채팅 닫기"
            onClick={onClose}
            className="rounded-full p-1.5 transition-colors hover:bg-primary-foreground/15"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div
          ref={listRef}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-muted/40 px-3 py-4"
        >
          <p className="px-2 text-center text-xs text-muted-foreground">
            {DUMMY_CHAT_EMPTY_HINT}
          </p>
          {messages.map((message) => {
            const isVisitor = message.sender === "visitor";
            return (
              <div
                key={message.id}
                className={cn(
                  "flex max-w-[85%] flex-col gap-1",
                  isVisitor ? "self-end items-end" : "self-start items-start"
                )}
              >
                {!isVisitor && (
                  <span className="px-1 text-[11px] text-muted-foreground">
                    {DUMMY_CHAT_AGENT_NAME}
                  </span>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
                    isVisitor
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-background text-foreground"
                  )}
                >
                  {message.content}
                </div>
                <time className="px-1 text-[10px] text-muted-foreground">
                  {formatTime(message.createdAt)}
                </time>
              </div>
            );
          })}
          {isBotTyping && <TypingBubble />}
        </div>

        <footer className="shrink-0 border-t border-border bg-background p-3">
          <div className="flex items-end gap-2 rounded-xl border border-input bg-card px-2 py-1.5">
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              placeholder={DUMMY_CHAT_PLACEHOLDER}
              disabled={isBotTyping}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => {
                inputFocusedRef.current = true;
                setInputFocused(true);
                const y = window.scrollY;
                requestAnimationFrame(() => window.scrollTo(0, y));
              }}
              onBlur={() => {
                window.setTimeout(() => {
                  const focused = document.activeElement === inputRef.current;
                  inputFocusedRef.current = focused;
                  setInputFocused(focused);
                }, 50);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendDraft();
                }
              }}
              className="max-h-24 min-h-[2.25rem] flex-1 resize-none bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            <button
              type="button"
              aria-label="메시지 보내기"
              disabled={!draft.trim() || isBotTyping}
              onClick={sendDraft}
              className={cn(
                "mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground",
                "disabled:opacity-40"
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </section>
    </>
  );
};

export default ChatPanel;
