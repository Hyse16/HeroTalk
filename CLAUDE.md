# HeroTalk - 개발 가이드 (CLAUDE.md)

> 이 문서는 Claude Code 전달용 개발 지침서입니다.
> 기획 원본: `prd/HEROTALK_CLAUDE.md`

---

## 게임 컨셉

**"말하는 만큼 강해진다"**

토익스피킹 실전 대비를 목표로, 마이크로 답변하며 2D RPG 캐릭터를 성장시키는 영어 말하기 학습 SaaS 웹 게임.
- 브라우저 바로 실행 (설치 없음), PC 웹 전용, 권장 브라우저: Chrome

---

## 기술 스택

| 구분 | 기술 | 버전 |
|---|---|---|
| Backend | Spring Boot | 3.2.5 |
| Build | Gradle Kotlin DSL | 8.5 |
| Auth | Spring Security 6.x + JWT (jjwt 0.12.3) + OAuth2 | - |
| ORM | JPA + QueryDSL 5.0.0 (Jakarta) | - |
| DB | MySQL 8.x (운영) / H2 (테스트) | - |
| Cache | Redis 7.x (랭킹 Sorted Set) | - |
| AI 채점 | Gemini Flash API | 무료 티어 |
| Frontend | Vite + React 18 + Phaser 3 | - |
| 음성인식 | Web Speech API (브라우저 내장) | - |

---

## 주요 파일 경로

```
build.gradle.kts
src/main/java/org/herotalk/
  HeroTalkApplication.java
  global/               → BaseTimeEntity, ApiResponse, GlobalExceptionHandler
  security/             → JwtProvider, JwtAuthenticationFilter, SecurityConfig
  security/oauth2/      → OAuth2UserInfo, Kakao/Google구현체, CustomOAuth2UserService, OAuth2SuccessHandler
  domain/user/          → User, UserStreak entity + repository
  domain/character/     → Character, CharacterStats entity + repository + service + controller
  domain/auth/          → AuthService, AuthController, dto
  domain/{battle,dungeon,question,item,achievement,quest,review}/  → Entity만 존재
src/main/generated/     → QueryDSL Q클래스 자동 생성 경로
src/main/resources/
  application.yml       → MySQL 운영 환경
  application-local.yml → 로컬 환경
src/test/resources/
  application.yml       → H2 테스트 환경

frontend/
  src/game/GameConfig.js
  src/store/authStore.js
  src/api/axios.js
  src/hooks/useSpeechRecognition.js
```

---

## 환경변수

```
DB_USERNAME, DB_PASSWORD
KAKAO_CLIENT_ID, KAKAO_CLIENT_SECRET
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
JWT_SECRET
REDIS_HOST, REDIS_PORT
GEMINI_API_KEY
```

JWT: Access Token 30분 / Refresh Token 7일

---

## 개발 순서 (현재 기준 권장)

> PRD 원본 순서에서 변경: 캐릭터 생성 프론트 선행 + 배틀 백엔드/채점 순서 조정

```
[완료] 1단계: 백엔드 환경 세팅
       Spring Boot, MySQL/H2, Redis, QueryDSL, JWT, OAuth2 설정

[완료] 2단계: 백엔드 기반 구현
       ERD 기반 Entity 18개, Repository, JWT 인증, OAuth2, Auth/Character API, 로그인 UI

[ ] 3단계: 캐릭터 생성 프론트 (최우선)
    - 신규 유저 → 캐릭터 이름 입력 + 직업 선택 (Warrior/Mage/Knight/Ranger)
    - 기존 유저 → 마을로 바로 이동
    - AuthResponse.newUser 값으로 분기 처리
    - 직업별 초기 스탯 세팅 (CharacterService 연동)

[ ] 4단계: 배틀 시스템 백엔드
    - BattleService: 배틀 시작/진행/종료
    - 문제 출제 로직 (question_history 기반 중복 방지)
    - 데미지 계산 공식 (아래 스펙 참고)
    - 몬스터 반격 로직
    - 경험치/골드 지급 + 레벨업 처리
    - 도망가기 일일 3회 제한 (Redis 또는 DB)
    - 복습 등록 (40점 이하 → review_questions 저장)
    - API: POST /api/battles/start, POST /api/battles/{id}/turn, POST /api/battles/{id}/end

[ ] 5단계: Gemini Flash 채점 연동
    - GeminiService: 답변 텍스트 → 채점 JSON 반환
    - 4단계 BattleService에 채점 결과 즉시 통합
    - 채점 프롬프트 설계 (아래 스펙 참고)
    - battle_turns에 score, feedback_good, feedback_bad, sample_answer 저장

[ ] 6단계: 마을 + 배틀 프론트
    - Phaser 마을 씬 (WASD 이동, NPC 상호작용)
    - 던전 선택 UI (레벨 해금 조건)
    - 배틀 씬 (포켓몬 스타일 턴제 UI)
    - 마이크 녹음 → Web Speech API → STT → 백엔드 전송
    - Gemini 채점 결과 연출 (크리티컬 이펙트 등)

[ ] 7단계: 성장 시스템
    - 레벨업 연출, 스탯 포인트 배분 UI
    - 캐릭터 외형 변화 (appearance 단계별)
    - 업적 달성 팝업

[ ] 8단계: 부가 시스템
    - Redis 랭킹 (글로벌/주간/보스)
    - 상점 (소모성 아이템 + 코스튬)
    - 복습 던전
    - 데일리 퀘스트
    - 출석 스트릭

[ ] 9단계: 마무리
    - 문제 DB 데이터 삽입
    - 튜토리얼 플로우
    - JWT 보안 강화 (refresh token Redis 저장 + type 검증)
    - 버그 수정, 배포
```

---

## 게임 플로우

```
로그인 (이메일 / 카카오 / 구글)
  ↓
신규 유저: 캐릭터 생성 (이름 + 직업)
기존 유저: 바로 마을 입장
  ↓
마을 (홈베이스)
  ├── 훈련소 → 튜토리얼
  ├── 상점 → 아이템/코스튬 구매
  ├── 랭킹보드
  └── 복습 던전
  ↓
던전 선택 (레벨 해금)
  ↓
필드 이동 (WASD) → 랜덤 인카운터 40%
  ↓
배틀 (포켓몬 스타일 턴제)
  ↓
클리어 → 경험치 + 골드 + 아이템
  ↓
레벨업 → 스탯 배분 → 외형 변화
```

---

## 배틀 시스템 스펙

### 턴 흐름
```
1. 몬스터 등장
2. 문제 출제 + 준비시간
3. 액션 선택 (마우스 클릭)
4. 공격 선택 시: 마이크 녹음 → STT → Gemini 채점
5. 점수 → 데미지 계산 → 몬스터 HP 감소
6. 몬스터 반격 → 내 HP 감소
7. 반복 (턴마다 새 문제, 중복 없음)
```

### 액션 4가지
```
공격 (말하기)  → 마이크 → STT → Gemini 채점 → 데미지
힌트 보기      → 키워드 제공, 데미지 -20% 패널티
패스           → 데미지 0, 몬스터 반격 1.5배
도망가기       → 배틀 종료, XP/골드 없음, 하루 3회 제한
```

### 점수 → 데미지 변환
```
100점     → 크리티컬  (데미지 150%)
80~99점   → 강타      (데미지 100%)
60~79점   → 일반      (데미지  70%)
40~59점   → 약타      (데미지  40%)
20~39점   → 미스      (데미지  10%)
0~19점    → 실패      (데미지   0% + 몬스터 반격 2배)

Fluency 스탯이 높을수록 동일 점수에서 데미지 배율 증가
```

### 몬스터 반격 공식
```
반격 데미지 = 몬스터 공격력 - (Grammar 스탯 × 2)
최소 데미지 = 5
```

### HP 0 처리
```
내 HP 0 → 게임오버 없음 → 마을 귀환 + 패배 경험치 50 XP
```

---

## Gemini 채점 스펙

```
채점 기준 (각 25점, 합산 100점):
  ① 발음/억양  (Pronunciation)
  ② 문법       (Grammar)
  ③ 어휘       (Vocabulary)
  ④ 내용완성도 (Content)

응답 형식 (JSON):
{
  "score": 85,
  "feedback_good": "논리적인 구조로 답변했어요",
  "feedback_bad": "접속사 다양성이 부족해요",
  "sample_answer": "I think ~ because ~ / Moreover ~"
}

40점 이하 → 자동 복습 등록 (review_questions)
```

---

## 직업 시스템

| 직업 | 초기 강점 | 패시브 |
|---|---|---|
| Warrior | Fluency ↑↑ | 짧은 답변 데미지 보너스 |
| Mage | Vocabulary ↑↑ | 어휘 채점 보너스 +10% |
| Knight | Grammar ↑↑ | 문법 실수 패널티 감소 |
| Ranger | Delivery ↑↑ | 준비시간 +10초 보너스 |

---

## 캐릭터 스탯

| 스탯 | 의미 | 게임 효과 |
|---|---|---|
| Fluency | 유창성 | 기본 데미지 배율 증가 |
| Grammar | 문법 | 몬스터 반격 데미지 감소 |
| Vocabulary | 어휘 | 크리티컬 확률 증가 |
| Delivery | 발음/억양 | 준비시간 +5초 보너스 |

레벨업 시 스탯 포인트 +3 → 직접 배분

---

## 레벨 & 경험치

```
필요 XP 공식: 레벨 × 200
  Lv1→2: 200 / Lv2→3: 400 / ...

경험치 획득:
  일반 몬스터 처치: HP × 0.5
  보스 처치:        HP × 1.0
  복습 던전 클리어: 기본 XP × 2
  패배 귀환:        50 XP
  데일리 퀘스트:    퀘스트당 100 XP
```

---

## 던전/몬스터 구성

| 지역 | 토익 파트 | 해금 레벨 |
|---|---|---|
| 훈련소 숲 | Part1 문장 읽기 | Lv1 |
| 초보자 숲 | Part2 사진 묘사 | Lv3 |
| 고블린 던전 | Part3 질문 답하기 | Lv8 |
| 사막 요새 | Part4 정보 활용 | Lv15 |
| 오크 요새 | Part5 해결책 제안 | Lv22 |
| 드래곤 성 | Part6 의견 제시 | Lv30 |

---

## ERD 요약 (19개 테이블)

```
users ──1:1── characters ──1:1── character_stats
users ──1:1── user_streaks
characters ──1:N── battles ──1:N── battle_turns ──N:1── questions
characters ──1:N── user_items, user_cosmetics, user_achievements
characters ──1:N── user_daily_quests, review_questions, question_history
dungeons ──1:N── monsters
```

전체 테이블: users, characters, character_stats, dungeons, monsters, questions,
battles, battle_turns, items, user_items, cosmetics, user_cosmetics,
achievements, user_achievements, daily_quests, user_daily_quests,
review_questions, user_streaks, question_history

---

## Redis 구조 (랭킹)

```
ZADD ranking:global  {누적XP}     {user_id}  → 글로벌 랭킹
ZADD ranking:weekly  {주간XP}     {user_id}  → 주간 랭킹 (매주 월요일 초기화)
ZADD ranking:boss    {클리어시간} {user_id}  → 보스 랭킹
```

---

## 프론트엔드 포트 및 경로

```
포트: 3000 (프록시 → 백엔드 8080)
경로 alias: @ → src/
주요 파일:
  src/game/GameConfig.js
  src/store/authStore.js
  src/api/axios.js
  src/hooks/useSpeechRecognition.js
```

---

## 레퍼런스 데이터 (DB 시딩용)

### 몬스터

| 몬스터 | 타입 | 지역 | HP | 공격력 | EXP | 골드 | 파트 |
|---|---|---|---|---|---|---|---|
| 슬라임 | NORMAL | 초보자 숲 | 200 | 10 | 100 | 15 | PART2 |
| 고블린 | NORMAL | 고블린 던전 | 350 | 20 | 175 | 20 | PART3 |
| 스켈레톤 | NORMAL | 고블린 던전 | 350 | 25 | 175 | 22 | PART3 |
| 오크 | NORMAL | 사막 요새 | 500 | 35 | 250 | 30 | PART4 |
| 트롤 | NORMAL | 오크 요새 | 600 | 45 | 300 | 38 | PART5 |
| 와이번 | NORMAL | 드래곤 성 | 750 | 55 | 375 | 48 | PART6 |
| 고블린 킹 | BOSS | 초보자 숲 | 1000 | 30 | 1000 | 150 | PART2 |
| 다크 나이트 | BOSS | 고블린 던전 | 1200 | 45 | 1200 | 200 | PART3 |
| 사막 군주 | BOSS | 사막 요새 | 1400 | 55 | 1400 | 250 | PART4 |
| 오크 워로드 | BOSS | 오크 요새 | 1500 | 65 | 1500 | 280 | PART5 |
| 드래곤 | BOSS | 드래곤 성 | 2000 | 80 | 2000 | 300 | PART6 |

### 소모성 아이템

| 아이템 | 타입 | 가격 | 효과값 |
|---|---|---|---|
| HP 포션 | HP_POTION | 30 | 50 |
| XP 부스터 | XP_BOOSTER | 80 | 150 (%) |
| 시간 연장권 | TIME_EXTEND | 50 | 15 (초) |
| 재도전권 | RETRY | 60 | 1 |
| 힌트 강화권 | HINT_BOOST | 40 | 1 |

### 코스튬

| 이름 | 타입 | 희귀도 | 가격 |
|---|---|---|---|
| 견습생 로브 | COSTUME | COMMON | 100 |
| 모험가 갑옷 | COSTUME | RARE | 300 |
| 기사단 풀갑옷 | COSTUME | EPIC | 800 |
| 드래곤 슬레이어 | COSTUME | LEGENDARY | 2000 |
| 다크 나이트 | COSTUME | LEGENDARY | 2500 |
| 낡은 검 | WEAPON | COMMON | 150 |
| 강철 활 | WEAPON | RARE | 400 |
| 마법 지팡이 | WEAPON | EPIC | 1000 |
| 전설의 대검 | WEAPON | LEGENDARY | 2200 |

### 업적

| 이름 | 조건 타입 | 조건값 | 보상 타입 | 보상값 |
|---|---|---|---|---|
| 첫 승리 | KILL | 1 | XP | 100 |
| 완벽한 공격 | CRITICAL | 1 | GOLD | 50 |
| 크리티컬 마스터 | CRITICAL | 10 | TITLE | 0 |
| 불굴의 의지 | STREAK | 7 | XP | 500 |
| 드래곤 슬레이어 | BOSS | 1 | TITLE | 0 |
| 수다쟁이 | SPEAK | 100 | GOLD | 100 |
| 복습왕 | REVIEW | 20 | XP | 300 |
| 토익 마스터 | BOSS | 5 | TITLE | 0 |
| 부자 모험가 | GOLD | 1000 | TITLE | 0 |

### 데일리 퀘스트 정의

| 이름 | 타입 | 목표값 | EXP 보상 | 골드 보상 |
|---|---|---|---|---|
| 몬스터 3마리 처치 | KILL | 3 | 100 | 50 |
| 크리티컬 1회 달성 | CRITICAL | 1 | 100 | 50 |
| 복습 던전 1회 클리어 | REVIEW | 1 | 100 | 50 |
| Part1 문제 2개 풀기 | PART_CLEAR | 2 | 100 | 50 |
| Part2 문제 2개 풀기 | PART_CLEAR | 2 | 100 | 50 |

### 튜토리얼 흐름 (첫 접속 강제 진행)
```
① 게임 설명 팝업
② 캐릭터 생성 (이름 + 직업 선택)
③ 훈련소 입장 안내
④ Part1 문장 읽기 체험 (1문제)
⑤ 액션 버튼 안내 (공격/힌트/패스/도망)
⑥ 배틀 1회 체험
⑦ 마을 귀환 → 자유 진행
```

### 레벨별 칭호 + 외형 + 토익스피킹 환산

| 레벨 | 칭호 | 외형(appearance) | 토익스피킹 예상 |
|---|---|---|---|
| Lv 1~5 | 견습생 | 1 | Lv1~2 |
| Lv 6~10 | 모험가 | 2 | Lv3~4 |
| Lv 11~20 | 용사 | 3 | Lv5~6 |
| Lv 21~30 | 영웅 | 4 | Lv7 |
| Lv 31~50 | 전설 | 5 | Lv7~8 |
| Lv MAX | HeroTalk Legend | 6 | Lv8 |

### 출석 스트릭 보상
```
1일  → XP ×1.1
3일  → XP ×1.3
7일  → XP ×1.5
30일 → 희귀 칭호 + 골드 200
```
