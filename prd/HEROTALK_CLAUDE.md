# 🎮 HeroTalk - 프로젝트 기획서 & ERD

> Claude Code에 전달용 문서입니다.
> 이 문서를 기반으로 개발을 진행해주세요.

---

## 📖 게임 컨셉

**"말하는 만큼 강해진다"**

토익스피킹 실전 대비를 목표로, 마이크로 답변하며 2D RPG 캐릭터를 성장시키는 영어 말하기 학습 SaaS 웹 게임.

- 브라우저에서 바로 실행 (설치 없음)
- 권장 브라우저: Chrome (Web Speech API)
- PC 웹 전용

---

## 🛠️ 기술 스택

| 구분 | 기술 | 버전 | 용도 |
|---|---|---|---|
| Language | Java | 17 (LTS) | 백엔드 언어 |
| Backend | Spring Boot | 3.2.x | REST API 서버 |
| 빌드 툴 | Gradle | Kotlin DSL | 빌드/의존성 관리 |
| 인증 | Spring Security + JWT | 6.x / jjwt 0.12.x | 로그인/인증 공통 |
| 소셜 로그인 | OAuth2 (카카오, 구글) | Spring OAuth2 Client | 소셜 인증 |
| ORM | JPA + QueryDSL | Hibernate 6.x | DB 연동 + 복잡 쿼리 |
| DB | MySQL | 8.x | 유저/게임 데이터 저장 |
| 테스트 DB | H2 | 인메모리 | 테스트 환경 |
| Cache | Redis | 7.x | 랭킹 Sorted Set |
| AI 채점 | Gemini Flash API | 무료 티어 | 토익스피킹 답변 채점 |
| Frontend | React + Phaser.js | React 18 / Phaser 3 | UI + 2D 게임 렌더링 |
| 음성인식 | Web Speech API | 브라우저 내장 | 마이크 → 텍스트 변환 (Chrome) |

### 주요 의존성 (build.gradle.kts)
```kotlin
dependencies {
    // Spring
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // DB
    runtimeOnly("com.mysql:mysql-connector-j")
    runtimeOnly("com.h2database:h2") // 테스트용

    // JWT
    implementation("io.jsonwebtoken:jjwt-api:0.12.3")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.3")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.3")

    // QueryDSL
    implementation("com.querydsl:querydsl-jpa:5.0.0:jakarta")
    annotationProcessor("com.querydsl:querydsl-apt:5.0.0:jakarta")

    // Lombok
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
```

---

## 🔐 회원/인증 시스템

### 로그인 방식 3가지 (모두 최종적으로 JWT 발급)

```
① 일반 로그인
   이메일 + 비밀번호
   → Spring Security 인증
   → JWT 발급

② 카카오 로그인
   카카오 OAuth2
   → 카카오 인증 완료
   → JWT 발급

③ 구글 로그인
   Google OAuth2
   → 구글 인증 완료
   → JWT 발급
```

### 공통 JWT 구조
```
Access Token  : 30분 (모든 API 요청 시 헤더 포함)
Refresh Token : 7일  (Access Token 만료 시 재발급)

Header: Authorization: Bearer {AccessToken}
```

### 소셜 로그인 처리
```
신규 유저 → 자동 회원가입 + 캐릭터 생성 페이지 이동
기존 유저 → JWT 발급 + 게임 입장
같은 이메일 → 일반/소셜 계정 통합 처리
```

---

## 🌍 전체 게임 흐름

```
① 로그인 (일반 / 카카오 / 구글)
↓
② 신규: 캐릭터 생성 (이름 + 직업 선택)
   기존: 바로 마을 입장
↓
③ 마을 (홈베이스)
   ├── 훈련소     → 튜토리얼 (첫 접속 강제 진행)
   ├── 상점       → 골드로 아이템/코스튬 구매
   ├── 랭킹보드   → 글로벌/주간/보스 랭킹
   └── 복습 던전  → 오답 문제 재도전
↓
④ 던전 선택 (레벨 조건 충족 시 해금)
↓
⑤ 필드 이동 (키보드 WASD/방향키)
   → 구역 진입 시 랜덤 인카운터 (확률 40%)
↓
⑥ 배틀 (포켓몬 스타일 턴제)
   이동: 키보드 / 액션 선택: 마우스 클릭
↓
⑦ 클리어 → 경험치 + 골드 + 아이템 획득
↓
⑧ 레벨업 → 스탯 포인트 배분 → 외형 변화
↓
⑨ 다음 던전 해금 → ④ 반복
```

---

## 🗺️ 월드 구조

| 지역 | 토익스피킹 파트 | 해금 조건 |
|---|---|---|
| 🏘️ 마을 | 튜토리얼 | 시작부터 |
| 📖 훈련소 숲 | Part1 문장 읽기 | Lv1 |
| 🌲 초보자 숲 | Part2 사진 묘사 | Lv3 |
| 🏚️ 고블린 던전 | Part3 질문에 답하기 | Lv8 |
| 🏜️ 사막 요새 | Part4 정보 사용 답하기 | Lv15 |
| 🌋 오크 요새 | Part5 해결책 제안 | Lv22 |
| 🐉 드래곤 성 | Part6 의견 제시 | Lv30 |
| ⚡ 주간 보스 | 혼합 전체 파트 | 매주 일요일 |

---

## 📝 토익스피킹 파트별 상세

### Part 1 - 문장 읽기
```
제시된 문장을 정확하게 소리내어 읽기
답변 시간 : 45초
채점 기준 : 발음, 억양, 강세
```

### Part 2 - 사진 묘사
```
제시된 사진을 영어로 묘사
준비 시간 : 45초 / 답변 시간 : 45초
채점 기준 : 어휘, 문법, 내용 완성도
```

### Part 3 - 질문에 답하기
```
주제 관련 3개 질문에 순서대로 답변
Q1/Q2 : 3초 준비 / 15초 답변
Q3    : 3초 준비 / 30초 답변
채점 기준 : 유창성, 문법, 어휘
```

### Part 4 - 제공된 정보 사용 답하기
```
표/일정/안내문 읽고 질문에 답변
준비 시간 : 45초
Q1/Q2    : 15초 답변 / Q3 : 30초 답변
채점 기준 : 정보 정확성, 문법, 어휘
```

### Part 5 - 해결책 제안
```
문제 상황 듣고 해결책 제안
준비 시간 : 45초 / 답변 시간 : 60초
채점 기준 : 논리성, 어휘, 문법, 유창성
```

### Part 6 - 의견 제시
```
주제에 대한 본인 의견 말하기
준비 시간 : 45초 / 답변 시간 : 60초
채점 기준 : 논리성, 근거, 어휘, 문법, 유창성
```

---

## ⚔️ 배틀 시스템

### 턴 흐름
```
1. 몬스터 등장
2. 토익스피킹 문제 출제 + 준비시간
3. 내 턴 → 액션 선택 (마우스 클릭)
4. 말하기 → Web Speech API → 텍스트 변환
5. Gemini Flash API → 채점 (0~100점)
6. 점수 → 데미지 계산 → 몬스터 HP 감소
7. 몬스터 반격 → 내 HP 감소
8. 몬스터 HP 0 될 때까지 반복 (턴마다 새 문제, 중복 없음)
```

### 액션 4가지
```
🎤 공격 (말하기)  → 마이크 녹음 → STT → Gemini 채점 → 데미지
📖 힌트 보기      → 키워드 힌트 제공, 데미지 -20% 패널티
⏭️ 패스           → 데미지 0, 몬스터 반격 1.5배
🏃 도망가기       → 배틀 종료, XP/골드 없음, 하루 3회 제한
```

### 채점 → 데미지 변환
```
100점     → 💥 크리티컬  (데미지 150%)
80~99점   → ⚔️ 강타      (데미지 100%)
60~79점   → 일반 공격    (데미지  70%)
40~59점   → 약한 공격    (데미지  40%)
20~39점   → 미스         (데미지  10%)
0~19점    → 실패         (데미지   0% + 몬스터 반격 2배)
```

Fluency 스탯이 높을수록 동일 점수에서 데미지 배율 증가

### 몬스터 반격 데미지 공식
```
반격 데미지 = 몬스터 공격력 - (Grammar 스탯 × 2)
최소 데미지 = 5
```

### AI 채점 기준 (Gemini Flash 프롬프트 설계)
```
토익스피킹 공식 채점 기준 4가지:
① 발음/억양  (Pronunciation) 25점
② 문법       (Grammar)       25점
③ 어휘       (Vocabulary)    25점
④ 내용완성도 (Content)       25점
→ 합산 100점

응답 형식 (JSON):
{
  "score": 85,
  "feedback_good": "논리적인 구조로 답변했어요",
  "feedback_bad": "접속사 다양성이 부족해요",
  "sample_answer": "I think ~ because ~ / Moreover ~"
}
```

### HP 0 처리
```
HP 0 → 게임오버 없음
     → 마을 귀환 + 패배 경험치 50 XP 지급
```

---

## 👾 몬스터 구성

### 일반 몬스터

| 몬스터 | 토익스피킹 파트 | HP | 공격력 | 난이도 | 지역 |
|---|---|---|---|---|---|
| 🟢 슬라임 | Part2 사진묘사 | 200 | 10 | ⭐ | 초보자 숲 |
| 👺 고블린 | Part3 질문답하기 | 350 | 20 | ⭐⭐ | 고블린 던전 |
| 💀 스켈레톤 | Part3 질문답하기 | 350 | 25 | ⭐⭐ | 고블린 던전 |
| 🟤 오크 | Part4 정보활용 | 500 | 35 | ⭐⭐⭐ | 사막 요새 |
| 🧌 트롤 | Part5 해결책제안 | 600 | 45 | ⭐⭐⭐ | 오크 요새 |
| 🐲 와이번 | Part6 의견제시 | 750 | 55 | ⭐⭐⭐⭐ | 드래곤 성 |

### 던전 보스

| 보스 | 지역 | HP | 공격력 |
|---|---|---|---|
| 👑 고블린 킹 | 초보자 숲 | 1000 | 30 |
| 🗡️ 다크 나이트 | 고블린 던전 | 1200 | 45 |
| 🏜️ 사막 군주 | 사막 요새 | 1400 | 55 |
| 💪 오크 워로드 | 오크 요새 | 1500 | 65 |
| 🐉 드래곤 | 드래곤 성 | 2000 | 80 |

### 주간 보스
```
매주 일요일 등장, 전 파트 혼합 출제
클리어 → 희귀 칭호 + 골드 500 + 주간 랭킹 반영
```

---

## 📊 캐릭터 스탯

| 스탯 | 토익스피킹 능력 | 게임 효과 |
|---|---|---|
| ⚔️ Fluency | 유창성 | 기본 데미지 배율 증가 |
| 🛡️ Grammar | 문법 정확도 | 몬스터 반격 데미지 감소 |
| ✨ Vocabulary | 어휘 다양성 | 크리티컬 확률 증가 |
| 🎯 Delivery | 발음/억양 | 준비시간 +5초 보너스 |

레벨업 시 스탯 포인트 +3 → 원하는 스탯에 직접 배분

---

## 🎭 직업 시스템 (캐릭터 생성 시 1회 선택)

| 직업 | 초기 강점 | 패시브 |
|---|---|---|
| ⚔️ 워리어 | Fluency ↑↑ | 짧고 강한 답변 데미지 보너스 |
| 🧙 매지션 | Vocabulary ↑↑ | 어휘 다양성 채점 보너스 +10% |
| 🛡️ 나이트 | Grammar ↑↑ | 문법 실수 패널티 감소 |
| 🏹 레인저 | Delivery ↑↑ | 준비시간 +10초 보너스 |

---

## 🏆 레벨 & 경험치 시스템

### 경험치 획득
```
일반 몬스터 처치  → 몬스터 HP × 0.5 XP
보스 처치         → 몬스터 HP × 1.0 XP
복습 던전 클리어  → 기본 XP × 2배
패배 귀환         → 50 XP
데일리 퀘스트     → 퀘스트당 100 XP
```

### 레벨업 필요 경험치
```
공식: 레벨 × 200 XP
Lv1 → Lv2 : 200 XP
Lv2 → Lv3 : 400 XP
Lv3 → Lv4 : 600 XP
...
```

### 레벨별 칭호 + 외형 + 토익스피킹 환산

| 레벨 | 칭호 | 외형 | 토익스피킹 예상 |
|---|---|---|---|
| Lv 1~5 | 🧑 견습생 | 기본 복장 | Lv1~2 |
| Lv 6~10 | ⚔️ 모험가 | 검 + 기본 갑옷 | Lv3~4 |
| Lv 11~20 | 🛡️ 용사 | 풀 갑옷 | Lv5~6 |
| Lv 21~30 | 👑 영웅 | 오라 이펙트 | Lv7 |
| Lv 31~50 | 🌟 전설 | 풀 이펙트 + 망토 | Lv7~8 |
| Lv MAX | 💎 HeroTalk Legend | 특별 외형 | Lv8 |

---

## 💰 골드 & 상점 시스템

### 골드 획득
```
일반 몬스터 처치 → 10~30골드
보스 처치        → 100~300골드
데일리 퀘스트    → 50골드
주간 보스 클리어 → 500골드
```

### 소모성 아이템

| 아이템 | 가격 | 효과 |
|---|---|---|
| 🧪 HP 포션 | 30골드 | HP 50 회복 |
| ⚡ XP 부스터 | 80골드 | 다음 배틀 XP 1.5배 |
| ⏰ 시간 연장권 | 50골드 | 준비시간 +15초 (1회용) |
| 🔄 재도전권 | 60골드 | 도망가기 횟수 초기화 |
| 💡 힌트 강화권 | 40골드 | 힌트 패널티 제거 (1회용) |

---

## 🎀 꾸미기 시스템

**종류:** 의상/코스튬, 무기
**획득 방식:** 골드로 상점 구매

### 희귀도별 가격
```
COMMON    → 100~200 골드
RARE      → 300~500 골드
EPIC      → 800~1200 골드
LEGENDARY → 2000+ 골드
```

### 코스튬 예시
```
👕 의상
├── 견습생 로브      (COMMON    / 100골드)
├── 모험가 갑옷      (RARE      / 300골드)
├── 기사단 풀갑옷    (EPIC      / 800골드)
├── 드래곤 슬레이어  (LEGENDARY / 2000골드)
└── 다크 나이트      (LEGENDARY / 2500골드)

⚔️ 무기
├── 낡은 검          (COMMON    / 150골드)
├── 강철 활          (RARE      / 400골드)
├── 마법 지팡이      (EPIC      / 1000골드)
└── 전설의 대검      (LEGENDARY / 2200골드)
```

```
착용: 의상 1개 + 무기 1개 동시 착용 가능
교체: 언제든지 가능
```

---

## 🔁 복습 시스템
```
40점 이하 답변 → 자동 복습 던전 저장 (최대 20문제)
복습 클리어    → XP 2배 + 골드 보너스
중복 방지      → 같은 문제 최소 10문제 이후 재출제
```

---

## 🏅 업적 시스템

| 업적 | 달성 조건 |
|---|---|
| 🥇 첫 승리 | 첫 몬스터 처치 |
| 💯 완벽한 공격 | 100점 답변 달성 |
| 💥 크리티컬 마스터 | 크리티컬 10회 |
| 🔥 불굴의 의지 | 7일 연속 출석 |
| 🐉 드래곤 슬레이어 | 드래곤 처치 |
| 🎤 수다쟁이 | 총 100번 말하기 |
| 📚 복습왕 | 복습 던전 20회 클리어 |
| 👑 주간 챔피언 | 주간 보스 4주 연속 클리어 |
| 🏆 토익 마스터 | 전 파트 보스 클리어 |
| 💰 부자 모험가 | 골드 1000 누적 |

---

## 📅 데일리 시스템
```
매일 초기화:
├── 데일리 퀘스트 3개 (랜덤 조합)
│   예) 몬스터 3마리 처치
│   예) 크리티컬 1회 달성
│   예) 복습 던전 1회 클리어
│   예) 특정 파트 문제 2개 풀기
│
└── 출석 스트릭 🔥
    1일  → XP ×1.1
    3일  → XP ×1.3
    7일  → XP ×1.5
    30일 → 희귀 칭호 + 골드 200
```

---

## 🏅 랭킹 시스템 (Redis Sorted Set)
```
📊 글로벌 랭킹 → 전체 유저 누적 XP 순위
🗓️ 주간 랭킹  → 이번 주 획득 XP 순위 (매주 초기화)
🐉 보스 랭킹  → 주간 보스 클리어 속도 순위
```

---

## 🎓 튜토리얼 흐름
```
첫 접속 시 강제 진행
① 게임 설명
② 캐릭터 생성
③ 훈련소 입장
④ Part1 문장 읽기 체험
⑤ 액션 버튼 안내 (공격/힌트/패스/도망)
⑥ 배틀 1회 체험
⑦ 마을 귀환 → 자유 진행
```

---

## 🕹️ 조작 방식
```
캐릭터 이동  : 키보드 WASD / 방향키
상호작용     : 스페이스바 (NPC 대화, 던전 입장)
배틀 액션    : 마우스 클릭
메뉴         : ESC
확인/선택    : Enter
권장 브라우저: Chrome
```

---

---

# 🗄️ ERD 설계

---

## 📋 전체 테이블 목록
```
1.  users               → 회원 정보
2.  characters          → 캐릭터 정보
3.  character_stats     → 캐릭터 스탯
4.  dungeons            → 던전 정보
5.  monsters            → 몬스터 정보
6.  questions           → 문제 DB
7.  battles             → 배틀 기록
8.  battle_turns        → 턴별 상세 기록
9.  items               → 소모성 아이템 정의
10. user_items          → 유저 보유 소모성 아이템
11. cosmetics           → 꾸미기 아이템 정의
12. user_cosmetics      → 유저 보유 꾸미기 아이템
13. achievements        → 업적 정의
14. user_achievements   → 유저 업적 달성 현황
15. daily_quests        → 데일리 퀘스트 정의
16. user_daily_quests   → 유저 데일리 퀘스트 현황
17. review_questions    → 복습 문제
18. user_streaks        → 출석 스트릭
19. question_history    → 문제 출제 이력 (중복 방지)
```

---

## 🗃️ 테이블 상세 설계

### 1. users (회원)
```sql
users
├── id              BIGINT PK AUTO_INCREMENT
├── email           VARCHAR(100) UNIQUE NOT NULL
├── password        VARCHAR(255) NULL          -- 소셜 로그인은 NULL
├── provider        ENUM('LOCAL','KAKAO','GOOGLE') DEFAULT 'LOCAL'
├── provider_id     VARCHAR(100) NULL          -- 소셜 고유 ID
├── nickname        VARCHAR(50) NOT NULL
├── is_active       BOOLEAN DEFAULT TRUE
├── last_login_at   DATETIME
├── created_at      DATETIME DEFAULT NOW()
└── updated_at      DATETIME DEFAULT NOW()
```

### 2. characters (캐릭터)
```sql
characters
├── id              BIGINT PK AUTO_INCREMENT
├── user_id         BIGINT FK → users.id
├── name            VARCHAR(50) NOT NULL
├── job             ENUM('WARRIOR','MAGE','KNIGHT','RANGER')
├── level           INT DEFAULT 1
├── exp             BIGINT DEFAULT 0
├── exp_to_next     BIGINT DEFAULT 200
├── hp              INT DEFAULT 100
├── max_hp          INT DEFAULT 100
├── gold            INT DEFAULT 0
├── stat_points     INT DEFAULT 0          -- 미배분 스탯 포인트
├── appearance      INT DEFAULT 1          -- 외형 단계 (1~6)
├── created_at      DATETIME DEFAULT NOW()
└── updated_at      DATETIME DEFAULT NOW()
```

### 3. character_stats (캐릭터 스탯)
```sql
character_stats
├── id              BIGINT PK AUTO_INCREMENT
├── character_id    BIGINT FK → characters.id
├── fluency         INT DEFAULT 1          -- 유창성 (데미지 배율)
├── grammar         INT DEFAULT 1          -- 문법 (반격 감소)
├── vocabulary      INT DEFAULT 1          -- 어휘 (크리티컬 확률)
├── delivery        INT DEFAULT 1          -- 발음/억양 (준비시간)
├── created_at      DATETIME DEFAULT NOW()
└── updated_at      DATETIME DEFAULT NOW()
```

### 4. dungeons (던전)
```sql
dungeons
├── id              BIGINT PK AUTO_INCREMENT
├── name            VARCHAR(100) NOT NULL
├── description     TEXT
├── toeic_part      ENUM('PART1','PART2','PART3','PART4','PART5','PART6')
├── required_level  INT DEFAULT 1
├── region          VARCHAR(50)
├── is_weekly_boss  BOOLEAN DEFAULT FALSE
├── created_at      DATETIME DEFAULT NOW()
└── updated_at      DATETIME DEFAULT NOW()
```

### 5. monsters (몬스터)
```sql
monsters
├── id              BIGINT PK AUTO_INCREMENT
├── dungeon_id      BIGINT FK → dungeons.id
├── name            VARCHAR(100) NOT NULL
├── monster_type    ENUM('NORMAL','BOSS','WEEKLY_BOSS')
├── hp              INT NOT NULL
├── attack_power    INT NOT NULL
├── exp_reward      INT NOT NULL
├── gold_reward     INT NOT NULL
├── toeic_part      ENUM('PART1','PART2','PART3','PART4','PART5','PART6')
├── difficulty      TINYINT DEFAULT 1      -- 1~5
├── created_at      DATETIME DEFAULT NOW()
└── updated_at      DATETIME DEFAULT NOW()
```

### 6. questions (문제 DB)
```sql
questions
├── id              BIGINT PK AUTO_INCREMENT
├── toeic_part      ENUM('PART1','PART2','PART3','PART4','PART5','PART6')
├── difficulty      TINYINT DEFAULT 1      -- 1~5
├── question_text   TEXT NOT NULL
├── image_url       VARCHAR(500) NULL      -- Part2 사진
├── context_data    TEXT NULL              -- Part4 표/안내문
├── prep_time       INT NOT NULL           -- 준비시간 (초)
├── answer_time     INT NOT NULL           -- 답변시간 (초)
├── sample_answer   TEXT NULL
├── hint            TEXT NULL
├── is_active       BOOLEAN DEFAULT TRUE
├── created_at      DATETIME DEFAULT NOW()
└── updated_at      DATETIME DEFAULT NOW()
```

### 7. battles (배틀 기록)
```sql
battles
├── id              BIGINT PK AUTO_INCREMENT
├── character_id    BIGINT FK → characters.id
├── monster_id      BIGINT FK → monsters.id
├── result          ENUM('WIN','LOSE','FLEE') NOT NULL
├── total_turns     INT DEFAULT 0
├── exp_gained      INT DEFAULT 0
├── gold_gained     INT DEFAULT 0
├── started_at      DATETIME DEFAULT NOW()
└── ended_at        DATETIME NULL
```

### 8. battle_turns (턴별 기록)
```sql
battle_turns
├── id              BIGINT PK AUTO_INCREMENT
├── battle_id       BIGINT FK → battles.id
├── question_id     BIGINT FK → questions.id
├── turn_number     INT NOT NULL
├── action          ENUM('ATTACK','HINT','PASS','FLEE')
├── answer_text     TEXT NULL              -- STT 변환 텍스트
├── score           INT NULL              -- 0~100점
├── feedback_good   TEXT NULL
├── feedback_bad    TEXT NULL
├── sample_answer   TEXT NULL
├── damage_dealt    INT DEFAULT 0
├── damage_taken    INT DEFAULT 0
├── is_critical     BOOLEAN DEFAULT FALSE
├── is_reviewed     BOOLEAN DEFAULT FALSE  -- 복습 등록 여부
└── created_at      DATETIME DEFAULT NOW()
```

### 9. items (소모성 아이템 정의)
```sql
items
├── id              BIGINT PK AUTO_INCREMENT
├── name            VARCHAR(100) NOT NULL
├── description     TEXT
├── item_type       ENUM('HP_POTION','XP_BOOSTER','TIME_EXTEND','RETRY','HINT_BOOST')
├── effect_value    INT NOT NULL
├── price           INT NOT NULL
├── is_active       BOOLEAN DEFAULT TRUE
└── created_at      DATETIME DEFAULT NOW()
```

### 10. user_items (유저 보유 소모성 아이템)
```sql
user_items
├── id              BIGINT PK AUTO_INCREMENT
├── character_id    BIGINT FK → characters.id
├── item_id         BIGINT FK → items.id
├── quantity        INT DEFAULT 0
├── created_at      DATETIME DEFAULT NOW()
└── updated_at      DATETIME DEFAULT NOW()
```

### 11. cosmetics (꾸미기 아이템 정의)
```sql
cosmetics
├── id              BIGINT PK AUTO_INCREMENT
├── name            VARCHAR(100) NOT NULL
├── cosmetic_type   ENUM('COSTUME','WEAPON')
├── description     TEXT
├── image_url       VARCHAR(500)
├── price           INT NOT NULL           -- 골드 가격
├── rarity          ENUM('COMMON','RARE','EPIC','LEGENDARY')
├── is_active       BOOLEAN DEFAULT TRUE
└── created_at      DATETIME DEFAULT NOW()
```

### 12. user_cosmetics (유저 보유 꾸미기)
```sql
user_cosmetics
├── id              BIGINT PK AUTO_INCREMENT
├── character_id    BIGINT FK → characters.id
├── cosmetic_id     BIGINT FK → cosmetics.id
├── is_equipped     BOOLEAN DEFAULT FALSE
├── obtained_at     DATETIME DEFAULT NOW()
└── created_at      DATETIME DEFAULT NOW()
```

### 13. achievements (업적 정의)
```sql
achievements
├── id              BIGINT PK AUTO_INCREMENT
├── name            VARCHAR(100) NOT NULL
├── description     TEXT
├── condition_type  ENUM('KILL','CRITICAL','STREAK','SPEAK','REVIEW','BOSS','GOLD')
├── condition_value INT NOT NULL
├── reward_type     ENUM('TITLE','GOLD','XP')
├── reward_value    INT DEFAULT 0
└── created_at      DATETIME DEFAULT NOW()
```

### 14. user_achievements (유저 업적)
```sql
user_achievements
├── id              BIGINT PK AUTO_INCREMENT
├── character_id    BIGINT FK → characters.id
├── achievement_id  BIGINT FK → achievements.id
├── current_value   INT DEFAULT 0
├── is_completed    BOOLEAN DEFAULT FALSE
├── completed_at    DATETIME NULL
└── created_at      DATETIME DEFAULT NOW()
```

### 15. daily_quests (데일리 퀘스트 정의)
```sql
daily_quests
├── id              BIGINT PK AUTO_INCREMENT
├── name            VARCHAR(100) NOT NULL
├── description     TEXT
├── quest_type      ENUM('KILL','CRITICAL','REVIEW','PART_CLEAR')
├── target_value    INT NOT NULL
├── exp_reward      INT NOT NULL
├── gold_reward     INT NOT NULL
└── created_at      DATETIME DEFAULT NOW()
```

### 16. user_daily_quests (유저 데일리 현황)
```sql
user_daily_quests
├── id              BIGINT PK AUTO_INCREMENT
├── character_id    BIGINT FK → characters.id
├── daily_quest_id  BIGINT FK → daily_quests.id
├── current_value   INT DEFAULT 0
├── is_completed    BOOLEAN DEFAULT FALSE
├── quest_date      DATE NOT NULL
├── completed_at    DATETIME NULL
└── created_at      DATETIME DEFAULT NOW()
```

### 17. review_questions (복습 문제)
```sql
review_questions
├── id              BIGINT PK AUTO_INCREMENT
├── character_id    BIGINT FK → characters.id
├── question_id     BIGINT FK → questions.id
├── battle_turn_id  BIGINT FK → battle_turns.id
├── original_score  INT NOT NULL
├── review_score    INT NULL
├── is_cleared      BOOLEAN DEFAULT FALSE
├── created_at      DATETIME DEFAULT NOW()
└── cleared_at      DATETIME NULL
```

### 18. user_streaks (출석 스트릭)
```sql
user_streaks
├── id              BIGINT PK AUTO_INCREMENT
├── user_id         BIGINT FK → users.id
├── current_streak  INT DEFAULT 0
├── max_streak      INT DEFAULT 0
├── last_login_date DATE NULL
└── updated_at      DATETIME DEFAULT NOW()
```

### 19. question_history (문제 출제 이력 - 중복 방지)
```sql
question_history
├── id              BIGINT PK AUTO_INCREMENT
├── character_id    BIGINT FK → characters.id
├── question_id     BIGINT FK → questions.id
└── last_shown_at   DATETIME DEFAULT NOW()
```

---

## 🔗 테이블 관계 요약

```
users            1 : 1   characters
users            1 : 1   user_streaks
characters       1 : 1   character_stats
characters       1 : N   battles
characters       1 : N   user_items
characters       1 : N   user_cosmetics
characters       1 : N   user_achievements
characters       1 : N   user_daily_quests
characters       1 : N   review_questions
characters       1 : N   question_history
battles          1 : N   battle_turns
battle_turns     N : 1   questions
dungeons         1 : N   monsters
items            1 : N   user_items
cosmetics        1 : N   user_cosmetics
achievements     1 : N   user_achievements
daily_quests     1 : N   user_daily_quests
questions        1 : N   review_questions
questions        1 : N   question_history
```

---

## 📦 Redis 구조 (랭킹)

```
ZADD ranking:global     {누적XP}      {user_id}  → 글로벌 랭킹
ZADD ranking:weekly     {주간XP}      {user_id}  → 주간 랭킹 (매주 월요일 초기화)
ZADD ranking:boss       {클리어시간}  {user_id}  → 보스 랭킹
```

---

## 🗓️ 개발 순서 (참고)

```
1단계: 환경 세팅          → Spring Boot, MySQL, Redis Docker, React
2단계: 백엔드 기반        → ERD 기반 테이블 생성, JWT 인증, 캐릭터 생성 API
3단계: AI 채점 연동       → Gemini Flash API 키 발급, 채점 프롬프트 설계
4단계: 배틀 시스템 백엔드 → 배틀 API, 데미지 계산, 경험치/골드 지급
5단계: 프론트 기반 UI     → 로그인, 마을 화면 (Phaser.js), 키보드 이동
6단계: 배틀 화면          → 배틀 씬, 마이크 연동, AI 채점 결과 연출
7단계: 성장 시스템        → 레벨업 연출, 스탯 배분, 캐릭터 외형 변화
8단계: 부가 시스템        → Redis 랭킹, 상점, 복습 던전, 튜토리얼
9단계: 마무리             → 버그 수정, 문제 DB 보충, 배포
```
