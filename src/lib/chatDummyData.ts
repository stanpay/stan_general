export type DummyChatSender = "agent" | "visitor";

export type DummyChatMessage = {
  id: string;
  sender: DummyChatSender;
  content: string;
  createdAt: string;
};

export const DUMMY_CHAT_AGENT_NAME = "스탠 상담";
export const DUMMY_CHAT_HEADER_TITLE = "문의하기";
export const DUMMY_CHAT_HEADER_SUBTITLE = "보통 몇 분 안에 답변드려요";
export const DUMMY_CHAT_PLACEHOLDER = "메시지를 입력하세요";
export const DUMMY_CHAT_EMPTY_HINT =
  "매장·쿠폰·이용 관련 궁금한 점을 남겨 주세요.";

/** 방문자가 보낸 뒤 더미 봇이 답하기까지 대기(ms) */
export const DUMMY_CHAT_REPLY_DELAY_MS = 2000;

/** 타이핑 후 붙일 더미 봇 응답 */
export const DUMMY_CHAT_BOT_REPLIES = [
  "확인했습니다. 조금만 기다려 주시면 자세히 안내해 드릴게요.",
  "문의 주셔서 감사합니다. 해당 내용은 매장·쿠폰 안내에서 확인하실 수 있어요.",
  "네, 도와드리겠습니다. 추가로 알려주실 내용이 있으면 편하게 적어 주세요.",
];

/** 초기 더미 대화 — UI 확인용 */
export const DUMMY_CHAT_MESSAGES: DummyChatMessage[] = [
  {
    id: "m1",
    sender: "agent",
    content: "안녕하세요! 스탠입니다. 무엇을 도와드릴까요?",
    createdAt: "2026-09-07T00:10:00+09:00",
  },
  {
    id: "m2",
    sender: "visitor",
    content: "제주 매장 쿠폰은 어떻게 사용하나요?",
    createdAt: "2026-09-07T00:10:30+09:00",
  },
  {
    id: "m3",
    sender: "agent",
    content:
      "매장 상세에서 쿠폰 안내 버튼을 눌러 주세요. 사용 방법과 유의사항을 바로 확인하실 수 있어요.",
    createdAt: "2026-09-07T00:11:00+09:00",
  },
];
