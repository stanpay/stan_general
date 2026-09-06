import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import ChatPanel from "@/components/ChatPanel";
import { CHAT_FAB_BOTTOM, CHAT_FAB_RIGHT, CHAT_FAB_SIZE } from "@/lib/chatFab";
import { cn } from "@/lib/utils";

/** 전역 우측 하단 채팅 FAB + 커스텀 채팅 팝업 (더미 UI) */
const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ChatPanel open={isOpen} onClose={() => setIsOpen(false)} />
      <button
        type="button"
        aria-label={isOpen ? "채팅 닫기" : "채팅 열기"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "fixed z-[60] flex items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg",
          "transition-[transform,opacity] duration-200 ease-out",
          "hover:brightness-110 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        style={{
          bottom: CHAT_FAB_BOTTOM,
          right: CHAT_FAB_RIGHT,
          width: CHAT_FAB_SIZE,
          height: CHAT_FAB_SIZE,
        }}
      >
        {isOpen ? (
          <X className="!h-6 !w-6" strokeWidth={2.25} />
        ) : (
          <MessageCircle className="!h-6 !w-6" strokeWidth={2.25} />
        )}
      </button>
    </>
  );
};

export default FloatingChatButton;
