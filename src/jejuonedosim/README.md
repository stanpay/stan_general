# `/jejuonedosim` — 제주 원도심 상권

`7b5550e` (Initial commit) 시점의 Main·지도뷰를 이 디렉터리에 고정한 스냅샷이다.

- **목적**: `/main`은 전국·커스텀 운영용. 상권별 엔드포인트는 각자 독립 유지.
- **범위**: `Main`, `MapViewBottomSheet`, `BottomNav`, 필터·핀 관련 훅/유틸.
- **공유**: UI 키트, API, locale, `StoreCard` 등 공통 인프라는 `@/` 를 그대로 쓴다.
- **주의**: 이 폴더 파일을 `/main` 작업과 섞어 수정하지 말 것. 상권 전용 변경만 여기서 한다.
