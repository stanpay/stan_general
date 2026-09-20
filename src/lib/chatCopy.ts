import type { AppLocale } from "@/lib/locale";

type ChatCopy = { title: string; open: string; close: string; backdrop: string; newWindow: string; loading: string; failed: string; retry: string };

export const CHAT_COPY: Record<AppLocale, ChatCopy> = {
  ko: { title: "스탠 AI 채팅", open: "채팅 열기", close: "채팅 닫기", backdrop: "채팅 배경 닫기", newWindow: "새 창에서 열기", loading: "채팅을 불러오는 중…", failed: "채팅을 불러오지 못했습니다. 다시 시도하거나 새 창에서 열어 주세요.", retry: "다시 시도" },
  en: { title: "Stan AI Chat", open: "Open chat", close: "Close chat", backdrop: "Close chat backdrop", newWindow: "Open in a new window", loading: "Loading chat…", failed: "Chat could not load. Try again or open it in a new window.", retry: "Try again" },
  ja: { title: "Stan AIチャット", open: "チャットを開く", close: "チャットを閉じる", backdrop: "チャットの背景を閉じる", newWindow: "新しいウィンドウで開く", loading: "チャットを読み込み中…", failed: "チャットを読み込めませんでした。再試行するか、新しいウィンドウで開いてください。", retry: "再試行" },
  zh: { title: "Stan AI 聊天", open: "打开聊天", close: "关闭聊天", backdrop: "关闭聊天背景", newWindow: "在新窗口中打开", loading: "正在加载聊天…", failed: "无法加载聊天。请重试或在新窗口中打开。", retry: "重试" },
};
