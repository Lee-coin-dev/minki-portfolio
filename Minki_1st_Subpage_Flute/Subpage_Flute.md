# Subpage — Flute Portfolio

> 이 문서는 **플루트 연주 포트폴리오** 페이지의 기획·카피·동작 명세입니다.  
> 레이아웃/코드 고도화 시 이 파일만 수정한 뒤, 아래 `주요 파일` 경로의 HTML/JS에 반영하세요.

---

## 페이지 정보

| 항목 | 내용 |
|------|------|
| **역할** | Minki의 플루트 실력·성장 스토리 소개 |
| **폴더** | `Minki_1st_Subpage_Flute/` |
| **학생** | Minki (민기) |
| **페이지 제목** | Minki — Flutist Portfolio |
| **섹션 수** | 3 (스크롤 + 클릭 전환 혼합) |
| **상태** | 디지털 프로토타입 v1 |

---

## 개요

보딩스쿨 지원용으로 **플루트 실력의 성장 과정**을 보여주는 페이지입니다.  
무대 커튼이 열린 극장 배경 위에서 연주자가 준비하고, 영상을 시청한 뒤, 성장 스토리를 읽는 흐름입니다.

---

## 기술 스택

| 기술 | 용도 |
|------|------|
| HTML / CSS | 극장 배경, 스테이지·모달 레이아웃 |
| JavaScript | 스크롤 줌, 키 글로우, 모달 전환 |
| GSAP + ScrollTrigger | 스크롤 연동 줌·포즈 전환 |

---

## 주요 파일

| 파일 | 역할 |
|------|------|
| `index.html` | 3개 섹션, SVG 캐릭터·악기, 비디오 모달 |
| `css/styles.css` | 극장 커튼, 스테이지, 설명 섹션 스타일 |
| `js/main.js` | 스크롤 애니메이션, 키 클릭, 모달 제어 |

---

## 디자인 가이드

| 항목 | 내용 |
|------|------|
| **분위기** | 프로페셔널, 클래식 무대 |
| **폰트** | Cormorant Garamond (제목), Jost (본문) |
| **배경** | 열린 붉은 무대 커튼 (`.theater`) |
| **캐릭터** | 10대 여성, 정장 무대 드레스, 왼쪽 스테이지 |
| **악기** | 플루트(우상단), 피콜로(우하단) — SVG 일러스트 |

---

## 사이트 연결

| 방향 | 대상 |
|------|------|
| **Inbound** | Mainpage Gecko Screen 5 → `Flute` 버튼 |
| **Outbound** | (통합 후) 메인 허브 복귀 링크 추가 예정 |

---

## 섹션 상세

### Screen 1 — Stage Intro (Instrument Pick)

| 필드 | 내용 |
|------|------|
| **HTML ID** | `#stage` |
| **목적** | 무대 세팅, 악기 선택 안내, 연주 준비 시작 |
| **화면 카피** | |
| → CTA 버튼 | `Click on either flute or piccolo` |
| → 플루트 라벨 | `flute` |
| → 피콜로 라벨 | `piccolo` |
| → 스크롤 안내 | `Scroll down — she's getting ready to play` |
| **비주얼** | 왼쪽: 무대 위 10대 여성 캐릭터(정장 드레스). 우상단: 플루트 + 설명. 우하단: 피콜로. 좌상단: CTA 버튼 |
| **인터랙션** | 스크롤 다운 → 준비 동작 시작. 플루트/피콜로 버튼 클릭 가능 |
| **애니메이션** | 스크롤에 따라 캐릭터가 연주 준비 자세로 전환 + 점진적 줌인 |

---

### Screen 2 — Ready to Play (Key Glow)

| 필드 | 내용 |
|------|------|
| **HTML ID** | `#stage` (동일 섹션, 스크롤 후반) |
| **목적** | 연주 준비 완료, 비디오 진입 트리거 |
| **화면 카피** | |
| → 안내 문구 | `Click the glowing key` |
| **비주얼** | 줌인 정지. 플루트 1번 키가 노란색으로 발광. 플루트가 올라가 입술에 닿은 자세 |
| **인터랙션** | **발광 키 클릭** → 비디오 모달 오픈 (스크롤로 화면 전환하지 않음) |
| **애니메이션** | 준비 화면 ↔ 비디오 화면 사이 스크롤 전환 없음. 클릭 전환만 사용 |

---

### Screen 3 — Video Modal + Descriptions

| 필드 | 내용 |
|------|------|
| **HTML ID** | `#videoModal`, `#descriptions` |
| **목적** | 연주 영상 시청 후 성장 스토리 전달 |
| **화면 카피 — 모달** | |
| → 키커 | `Performance` |
| → 모달 제목 | `Watch Minki Play` |
| → 영상 메타 | `2:43 · Flute Solo · Spring Recital` |
| → 모달 안내 | `When you're done, close this and scroll down.` |
| **화면 카피 — 설명 섹션** | |
| → 키커 | `Second Movement` |
| → 섹션 제목 | `A Voice That Grew With Me` |
| → 본문 1 | `I began studying the flute at the age of seven, drawn to the way a single breath could turn into a clear, singing line. What started as curiosity quickly became the discipline that has shaped my days.` |
| → 본문 2 | `Over the past decade I have performed in school ensembles, regional youth orchestras, and solo recitals. Each performance taught me to listen more carefully — to my own tone, and to the musicians around me.` |
| → 본문 3 | `The flute has given me patience, precision, and a quiet confidence. I hope to carry that voice forward and keep growing as a musician at your school.` |
| **비주얼** | 모달: 팝업 형태 비디오 플레이어. 설명 섹션: 왼쪽 2장 사진, 오른쪽 본문. 상단에 플루트 일러스트(2번 키 발광) |
| **인터랙션** | 모달 닫기 → 스크롤 다운 → 설명 섹션 등장 |
| **애니메이션** | 스크롤 시 플루트가 위로 올라오며 설명과 함께 표시 |

---

## 에셋 목록

| 에셋 | 경로 / 비고 |
|------|-------------|
| 캐릭터 SVG | `index.html` `#svg-templates` |
| 플루트·피콜로 SVG | `index.html` `#svg-templates` |
| 연주 사진 1 | `.photo-fill--1` (CSS 배경 — 실제 이미지 교체 예정) |
| 연주 사진 2 | `.photo-fill--2` (CSS 배경 — 실제 이미지 교체 예정) |
| 연주 영상 | 모달 내 비디오 (파일 경로 미지정 — 추가 예정) |

---

## 향후 수정 메모

- [ ] 실제 연주 영상 파일 추가 및 `js/main.js` 연결
- [ ] 연주 사진 2장을 실제 이미지로 교체
- [ ] 피콜로 선택 시 분기 콘텐츠(영상·카피) 정의
- [ ] 메인 허브 복귀 네비게이션 추가
- [ ] 본문 카피를 Minki 실제 이력에 맞게 업데이트
