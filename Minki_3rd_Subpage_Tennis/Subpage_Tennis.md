# Subpage — Tennis Portfolio

> 이 문서는 **테니스 포트폴리오** 페이지의 기획·카피·동작 명세입니다.  
> 레이아웃/코드 고도화 시 이 파일만 수정한 뒤, 아래 `주요 파일` 경로의 HTML/JS에 반영하세요.

---

## 페이지 정보

| 항목 | 내용 |
|------|------|
| **역할** | Minki의 테니스 실력·성장 스토리 소개 |
| **폴더** | `Minki_3rd_Subpage_Tennis/` |
| **학생** | Minki (민기) |
| **페이지 제목** | Irene Suh — 2026 South Korea Open Final |
| **섹션 수** | 6 (게임 UI + 콘텐츠 전환) |
| **상태** | 디지털 프로토타입 v1 |

> **이름 정리:** 포트폴리오 주인공은 Minki(민기)이나, 현재 구현된 HTML/JS에는 `Irene Suh`로 표기되어 있습니다. 통합·고도화 시 아래 카피의 `Irene Suh` → `Minki` (또는 공식 영문명)로 일괄 변경하세요.

---

## 개요

2026 South Korea Open 결승을 **게임 형식**으로 체험하는 인터랙티브 포트폴리오입니다.  
테니스볼을 클릭해 랠리를 진행하고, 세트마다 영상·역사·동기·시상대 콘텐츠가 순차적으로 열립니다.

---

## 기술 스택

| 기술 | 용도 |
|------|------|
| HTML / CSS | 게임 화면, 콘텐츠 카드, 시상대 |
| JavaScript | 화면 전환, 스코어보드, 볼 애니메이션 |
| GSAP | 볼 비행, 전환 이펙트 |

---

## 주요 파일

| 파일 | 역할 |
|------|------|
| `index.html` | 6개 화면, SVG 코트·선수, 콘텐츠 섹션 |
| `styles.css` | 테니스 코트, 스코어보드, 시상대 스타일 |
| `script.js` | 게임 루프, 스코어 업데이트, 화면 전환 |
| `irene-tennis.mp4` | 연주 영상 (미배치 시 폴백 UI 표시) |

---

## 디자인 가이드

| 항목 | 내용 |
|------|------|
| **분위기** | 스포츠 게임, 카툰 2D, 역동적 |
| **폰트** | Bungee (토너먼트), Outfit (본문) |
| **코트** | 야외 그린·옐로우 코트, 관중석, 푸른 하늘·구름·태양 |
| **주인공** | 왼쪽: 13세 여성 캐릭터 (Irene Suh / → Minki). 오른쪽: 다른 헤어스타일의 상대 `Player 1` |
| **스코어보드** | 보라색, SET 1·2·3 표시 |

---

## 사이트 연결

| 방향 | 대상 |
|------|------|
| **Inbound** | Mainpage Gecko Screen 5 → `Tennis` 버튼 |
| **Outbound** | (통합 후) 메인 허브 복귀 링크 추가 예정 |

---

## 섹션 상세

### Screen 1 — Game Start

| 필드 | 내용 |
|------|------|
| **HTML ID** | `#screen-start` |
| **목적** | 토너먼트 소개, 게임 시작 |
| **화면 카피** | |
| → 토너먼트 태그 | `2026 SOUTH KOREA OPEN` |
| → 메인 타이틀 | `FINAL` |
| → 대진 | `IRENE SUH` V.S. `PLAYER 1` |
| → CTA 버튼 | `GAME START` |
| → 힌트 | `click the ball to begin the match` |
| **비주얼** | 애니메이션 테니스 코트 배경 |
| **인터랙션** | `GAME START` 클릭 → Screen 2 (매치 화면) |

---

### Screen 2 — Tennis Match (Set 1)

| 필드 | 내용 |
|------|------|
| **HTML ID** | `#screen-game` |
| **목적** | 1세트 랠리, 영상 콘텐츠 진입 |
| **화면 카피** | |
| → 스코어보드 헤더 | `MATCH SCORE` |
| → 플레이어 1 | `IRENE SUH` (0, 0, 0) |
| → 플레이어 2 | `PLAYER 1` (0, 0, 0) |
| → 게임 안내 | `Click the tennis ball to hit it! 🎾` |
| **비주얼** | 2D 카툰 야외 코트, 관중석(일부 `ACE!` 플래카드). 왼쪽 주인공, 오른쪽 상대. 공이 왼쪽 선수 앞에 떠 있음 |
| **인터랙션** | 테니스볼 클릭 → 공이 오른쪽으로 비행 → 바운스 시 Screen 3 (영상) 전환 |
| **애니메이션** | 라켓 스윙 + 볼 비행 GSAP |

---

### Screen 3 — Match Video (Set 1 Content)

| 필드 | 내용 |
|------|------|
| **HTML ID** | `#screen-video` |
| **목적** | 실제 경기 영상 시청 |
| **화면 카피** | |
| → 키커 | `SET 1 — MATCH POINT` |
| → 제목 | `Irene on the Court` |
| → 서브 | `Watch Irene Suh in action — footage of her own game.` |
| → 영상 폴백 | `🎾 Irene Suh — match footage` / `Drop a clip named irene-tennis.mp4 in this folder to show real video.` |
| → 복귀 버튼 | `Go Back to the Game` |
| **비주얼** | 비디오 플레이어 (또는 폴백 애니메이션) |
| **인터랙션** | `Go Back to the Game` → Screen 4 (스코어 업데이트된 매치) |

---

### Screen 4 — Tennis Match (Set 2) + History

| 필드 | 내용 |
|------|------|
| **HTML ID** | `#screen-game` (복귀), `#screen-history` |
| **목적** | 2세트 진행, 테니스 역사 소개 |
| **스코어보드 변화** | Irene SET 1 = `6`, Player 1 SET 1 = `6` 미만 랜덤 |
| **화면 카피 — History** | |
| → 키커 | `SET 2 — THE JOURNEY` |
| → 제목 | `Irene Suh's Tennis History` |
| → 서브 | `Every champion starts somewhere. Here's the road so far.` |
| → 타임라인 1 | `Age 8 — First Racquet` / `Picked up a racquet at a local club and never put it down.` |
| → 타임라인 2 | `Age 11 — Junior League` / `Joined her first competitive junior league and reached the semifinals.` |
| → 타임라인 3 | `Age 12 — Regional Champion` / `Won her first regional title with a straight-sets victory.` |
| → 타임라인 4 | `Age 13 — National Finalist` / `Now competing in the 2026 South Korea Open Final.` |
| → 복귀 버튼 | `Go Back to the Game` |
| **비주얼** | 오른쪽 선수가 공을 치고 공이 왼쪽으로 비행. 바운스 시 History 화면 |
| **인터랙션** | 볼 클릭 → History → 복귀 |

---

### Screen 5 — Tennis Match (Set 3) + Reasons

| 필드 | 내용 |
|------|------|
| **HTML ID** | `#screen-game` (복귀), `#screen-reasons` |
| **목적** | 3세트 완료, 테니스를 시작한 이유 소개 |
| **스코어보드 변화** | Irene 3세트 모두 승리 표시 |
| **화면 카피** | |
| → 키커 | `SET 3 — WON! 🏆` |
| → 제목 | `Why Irene Started Playing Tennis` |
| → 서브 | `The story behind the swing.` |
| → 이유 1 | `For the love of the game` / `The thrill of a perfectly timed shot is unmatched.` |
| → 이유 2 | `Discipline & focus` / `Tennis taught her patience, resilience, and how to stay calm under pressure.` |
| → 이유 3 | `Family inspiration` / `Watching matches with her family sparked the dream.` |
| → 이유 4 | `To go the distance` / `She wants to represent Korea on the world stage one day.` |
| → CTA | `Look at Results` |
| **인터랙션** | Screen 3과 동일한 볼 클릭 패턴 → Reasons → `Look at Results` → Screen 6 |

---

### Screen 6 — Podium (Final Results)

| 필드 | 내용 |
|------|------|
| **HTML ID** | `#screen-podium` |
| **목적** | 우승·노력 스토리 마무리 |
| **화면 카피** | |
| → 제목 | `2026 South Korea Open — Final Results` |
| → 1위 | `Irene Suh` 🥇 |
| → 2위 | `Player 1` 🥈 |
| → 3위 | `Player 2` 🥉 |
| → 챔피언 문구 | `Irene Suh — Champion. 🏆` |
| → 본문 | `This medal didn't come easy. Years of early-morning practices, blistered hands, lost matches, and relentless drills brought Irene here. Every serve, every sprint to the net, every late-night film session paid off in the 2026 South Korea Open Final. Hard work, heart, and an unshakable love for the game made her a champion.` |
| → 재시작 | `Play Again` |
| **비주얼** | 시상대 3단, 1위에 골드 메달·컨페티 |
| **인터랙션** | `Play Again` → Screen 1으로 리셋 |

---

## 에셋 목록

| 에셋 | 경로 / 비고 |
|------|-------------|
| 경기 영상 | `irene-tennis.mp4` (미배치 시 폴백 UI) |
| 코트·선수 | `index.html` 내 SVG (`#matchScene`) |
| 역사 사진 | 현재 이모지 플레이스홀더 (🎾🏫🏆🇰🇷) — 실제 사진 교체 예정 |

---

## 향후 수정 메모

- [ ] `Irene Suh` → `Minki` (또는 공식 영문명) 전체 일괄 변경
- [ ] `irene-tennis.mp4` → `minki-tennis.mp4` 등 파일명 정리
- [ ] 타임라인·이유·시상대 카피를 Minki 실제 이력에 맞게 업데이트
- [ ] 역사 섹션 이모지 → 실제 경기/훈련 사진으로 교체
- [ ] 메인 허브 복귀 네비게이션 추가
- [ ] 상대 선수 이름·스코어 로직 커스터마이즈
