# Subpage — Marine Biology Portfolio

> 이 문서는 **해양생물학 포트폴리오** 페이지의 기획·카피·동작 명세입니다.  
> 레이아웃/코드 고도화 시 이 파일만 수정한 뒤, 아래 `주요 파일` 경로의 HTML/JS에 반영하세요.

---

## 페이지 정보

| 항목 | 내용 |
|------|------|
| **역할** | Minki의 해양생물학 관심·탐구 스토리 소개 |
| **폴더** | `Minki_2nd_Subpage_Marine_Biology/` |
| **학생** | Minki (민기) |
| **페이지 제목** | Into the Deep — A Descent Through the Ocean Zones |
| **섹션 수** | 5 (클릭 + 스크롤 싱크 다이브) |
| **상태** | 디지털 프로토타입 v1 |

---

## 개요

낚싯배 위 10대 소녀가 가짜 미끼를 던져 바다 깊이 내려가며, **5개 해양층(Sunlight → Abyssal)** 을 탐험하는 스크롤 내러티브입니다.  
각 층마다 해당 해양생물과 설명이 등장합니다.

---

## 기술 스택

| 기술 | 용도 |
|------|------|
| HTML / CSS | 해양층별 배경, 생물 카드 레이아웃 |
| JavaScript | 캐스팅, 미끼 추적, 스크롤 싱크 |
| GSAP + ScrollTrigger + MotionPathPlugin | 낚싯대 동작, 미끼 하강 경로 |

---

## 주요 파일

| 파일 | 역할 |
|------|------|
| `index.html` | 5개 섹션, 생물 이미지, 해저 피날레 |
| `styles.css` | 수면·심해 그라데이션, 생물 카드 스타일 |
| `script.js` | 캐스팅 인터랙션, 미끼·낚싯줄 추적 |
| `images/` | 해양생물 PNG 에셋 |

---

## 디자인 가이드

| 항목 | 내용 |
|------|------|
| **분위기** | 밝고 탐험적인, 교육적 |
| **폰트** | Fredoka (제목), Quicksand (본문) |
| **캐릭터** | 10대 소녀, 분홍 운동 반팔 + 검정 운동 반바지 |
| **미끼** | 가짜 물고기 모양 루어 (실제 생물 아님) |
| **수심 게이지** | `#depth-gauge` — 스크롤에 따라 수심 표시 |

---

## 사이트 연결

| 방향 | 대상 |
|------|------|
| **Inbound** | Mainpage Gecko Screen 5 → `Marine Biology` 버튼 |
| **Outbound** | (통합 후) 메인 허브 복귀 링크 추가 예정 |

---

## 섹션 상세

### Screen 1 — Hero (Cast the Line)

| 필드 | 내용 |
|------|------|
| **HTML ID** | `#hero` |
| **목적** | 낚시 캐스팅으로 다이브 시작 |
| **화면 카피** | |
| → 메인 타이틀 | `Into the Deep` |
| → 서브 카피 | `A descent through the ocean's five layers of light.` |
| → CTA | `Tap anywhere to cast your line` |
| → 스크롤 안내 | `Scroll to sink` |
| **비주얼** | 맑은 하늘(태양·구름), 투명한 푸른 바다. 낚싯배 위 소녀가 낚싯대를 들고 캐스팅 준비. 미끼는 가짜 물고기 루어 |
| **인터랙션** | 화면 클릭 → 낚싯대 캐스팅 → 미끼가 하늘로 날아가 물에 떨어짐 → 작은 물보라 → 미끼가 가라앉기 시작 |
| **애니메이션** | 캐스팅 후 카메라가 미끼를 따라 이동. 이후 스크롤로 심해 하강 |

---

### Screen 2 — Sunlight Zone (Epipelagic)

| 필드 | 내용 |
|------|------|
| **HTML ID** | `#sunlight` |
| **목적** | 표층 해양생태 소개 |
| **화면 카피** | |
| → 존 라벨 (영문) | `Epipelagic` |
| → 존 이름 | `Sunlight Zone` |
| → 수심 | `0 – 200 m` |
| → Sea Lion 메모 | `Playful and fast, sea lions dive here where sunlight still fuels rich blooms of life.` |
| → Whale Shark 메모 | `The gentle giant — the largest fish alive — filter-feeds on plankton near the surface.` |
| **비주얼** | Screen 1보다 약간 어두운 투명한 푸른 물. 미끼가 가라앉는 중. 해양생물 2종 + 메모 |
| **인터랙션** | 스크롤 다운 |
| **에셋** | `images/Sea_lion_sunlight_zone.png`, `images/Whale_shark_sunlight_zone.png` |

---

### Screen 3 — Twilight Zone (Mesopelagic)

| 필드 | 내용 |
|------|------|
| **HTML ID** | `#twilight` |
| **목적** | 점점 어두워지는 중층 해양 소개 |
| **화면 카피** | |
| → 존 라벨 | `Mesopelagic` |
| → 존 이름 | `Twilight Zone` |
| → 수심 | `200 – 1000 m` |
| → 카드 제목 | `Fading Light` |
| → 카드 본문 | `Only a faint blue glow survives here. Photosynthesis stops, and animals begin to make their own light to hunt, hide, and find one another.` |
| → Sperm Whale 메모 | `Dives over 1000 m on a single breath to hunt squid in near-total darkness.` |
| **비주얼** | 미끼 중앙. 왼쪽: 사진+설명 카드. 오른쪽: 고래·게. Sunlight Zone보다 어두운 물 |
| **인터랙션** | 스크롤 다운 |
| **에셋** | `images/crab_twilight_zone.png`, `images/Sperm_whale_twilight_zone.png` |

---

### Screen 4 — Midnight Zone (Bathypelagic)

| 필드 | 내용 |
|------|------|
| **HTML ID** | `#midnight` |
| **목적** | 심해 야간층, 발광 생물 소개 |
| **화면 카피** | |
| → 존 라벨 | `Bathypelagic` |
| → 존 이름 | `Midnight Zone` |
| → 수심 | `1000 – 4000 m` |
| → 카드 제목 | `Eternal Night` |
| → 카드 본문 | `No sunlight reaches this far. The water is icy and the pressure crushing. Life here glows with bioluminescence to lure prey and startle predators.` |
| → Anglerfish 메모 | `Dangles a glowing lure from its head to draw curious prey into its jaws.` |
| **비주얼** | 미끼 중앙. 왼쪽: 콜로설 스퀴드 카드. 오른쪽: 아귀. Twilight Zone보다 더 어두운 물 |
| **인터랙션** | 스크롤 다운 |
| **에셋** | `images/colossal_squid_midnight_zone.png`, `images/angler_fish_midnight_zone.png` |

---

### Screen 5 — Abyssal Zone (Seafloor Finale)

| 필드 | 내용 |
|------|------|
| **HTML ID** | `#abyss` |
| **목적** | 해저 도달, 학업 탐구 의지 메시지 |
| **화면 카피** | |
| → 존 라벨 | `Abyssopelagic` |
| → 존 이름 | `Abyssal Zone` |
| → 수심 | `4000 – 6000 m` |
| → Frilled Shark 메모 | `A living fossil with frilly gills and rows of needle teeth, nearly unchanged for millions of years.` |
| → Sea Cucumbers 메모 | `The vacuum cleaners of the seabed, recycling nutrients in the cold, still dark.` |
| → 해저 타이틀 | `You've Reached the Floor!` |
| → 해저 본문 1 | `You've reached the end of the ocean, but the end only means the beginning.` |
| → 해저 본문 2 | `I know that this is the beginning of exploring the academic world.` |
| **비주얼** | 화면 하단 1/3이 해저. 미끼 중앙. 프릴상어·해삼. Midnight Zone보다 가장 어두움 |
| **인터랙션** | 스크롤로 해저 도달 |
| **에셋** | `images/Frilled_Shark_Abyss_zone.png`, `images/Sea_cucumbers_abyss_zone.png` |

---

## 에셋 목록

| 파일명 | 용도 |
|--------|------|
| `Sea_lion_sunlight_zone.png` | Sunlight Zone — 바다사자 |
| `Whale_shark_sunlight_zone.png` | Sunlight Zone — 고래상어 |
| `crab_twilight_zone.png` | Twilight Zone — 게 (카드 이미지) |
| `Sperm_whale_twilight_zone.png` | Twilight Zone — 향고래 |
| `colossal_squid_midnight_zone.png` | Midnight Zone — 콜로설 스퀴드 |
| `angler_fish_midnight_zone.png` | Midnight Zone — 아귀 |
| `Frilled_Shark_Abyss_zone.png` | Abyssal Zone — 프릴상어 |
| `Sea_cucumbers_abyss_zone.png` | Abyssal Zone — 해삼 |

---

## 향후 수정 메모

- [ ] `images/` 폴더에 실제 PNG 파일 배치 확인
- [ ] 해저 피날레 카피를 Minki 실제 해양생물학 이력에 맞게 업데이트
- [ ] 각 존 생물 설명을 Minki의 탐구·프로젝트와 연결
- [ ] 메인 허브 복귀 네비게이션 추가
- [ ] 모바일 터치 캐스팅 UX 개선
