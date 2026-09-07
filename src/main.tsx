import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initClarity } from "@/lib/analytics";

initClarity();
createRoot(document.getElementById("root")!).render(<App />);
document.addEventListener("dragstart", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, [contenteditable='true']"))
        return;
    event.preventDefault();
});
// 핀치 줌 차단은 지도 영역에만 적용한다.
// 문서 전체에 걸면 본문 확대가 막혀 접근성 기준(WCAG 1.4.4)에 어긋난다.
const preventGestureInsideMap = (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest(".map-container")) {
        event.preventDefault();
    }
};
document.addEventListener("gesturestart", preventGestureInsideMap);
document.addEventListener("gesturechange", preventGestureInsideMap);
document.addEventListener("gestureend", preventGestureInsideMap);
// Vite 개발 서버에서는 SW cache-first가 모듈/CSS를 고정해
// 하단 네비·FAB 등이 "안 보이는" 것처럼 깨질 수 있어 등록하지 않는다.
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        if (import.meta.env.DEV) {
            void navigator.serviceWorker.getRegistrations().then((regs) => {
                for (const reg of regs) void reg.unregister();
            });
            return;
        }
        navigator.serviceWorker.register("/service-worker.js").catch((error) => {
            // 등록 실패를 삼키면 오프라인 동작 이상을 추적할 수 없다
            console.error("[SW] 서비스워커 등록 실패", error);
        });
    });
}
