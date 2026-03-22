# 배틀 시스템 백엔드 설계 스펙

**날짜:** 2026-03-22
**관련 단계:** 4단계 — 배틀 시스템 백엔드

---

## 개요

턴제 배틀 시스템 백엔드를 구현한다. 플레이어가 몬스터와 1:1 배틀을 진행하며, 액션(ATTACK/HINT/PASS/FLEE)에 따라 데미지를 주고받는다. Gemini 채점은 5단계에서 연동하며, 이 단계에서는 클라이언트가 점수를 직접 전달하는 Stub 방식으로 처리한다.

---

## 설계 결정 사항

| 항목 | 결정 | 이유 |
|---|---|---|
| Gemini 채점 | Stub (score 파라미터로 전달) | 배틀 로직 독립 테스트 가능 |
| 도망 제한 저장소 | DB (Character 컬럼) | Redis 의존성 최소화 |
| API 구조 | 통합 엔드포인트 (`/turn`) | 클라이언트 단순화 |
| 캐릭터 HP 관리 | Battle 엔티티 (`currentCharacterHp`) | 배틀 간 HP 독립 |

---

## 변경 파일 목록

### 기존 엔티티 수정
| 파일 | 변경 내용 |
|---|---|
| `domain/character/entity/Character.java` | `fleeCount`, `fleeResetDate` 필드 추가 |
| `domain/battle/entity/Battle.java` | `currentCharacterHp` 필드 추가 |

### 신규 파일
| 파일 | 유형 |
|---|---|
| `domain/battle/repository/BattleRepository.java` | 신규 |
| `domain/battle/repository/BattleTurnRepository.java` | 신규 |
| `domain/question/repository/QuestionRepository.java` | 신규 |
| `domain/question/repository/QuestionHistoryRepository.java` | 신규 |
| `domain/review/repository/ReviewQuestionRepository.java` | 신규 |
| `domain/battle/service/BattleService.java` | 신규 |
| `domain/battle/service/BattleDamageCalculator.java` | 신규 |
| `domain/battle/service/QuestionSelector.java` | 신규 |
| `domain/battle/controller/BattleController.java` | 신규 |
| `domain/battle/dto/BattleStartRequest.java` | 신규 |
| `domain/battle/dto/BattleStartResponse.java` | 신규 |
| `domain/battle/dto/BattleTurnRequest.java` | 신규 |
| `domain/battle/dto/BattleTurnResponse.java` | 신규 |

---

## 엔티티 수정 상세

### Character.java — flee 제한 필드 추가

```java
@Column(name = "flee_count", nullable = false)
@Builder.Default
private int fleeCount = 0;

@Column(name = "flee_reset_date")
private LocalDate fleeResetDate;

public boolean canFlee() {
    if (fleeResetDate == null || !fleeResetDate.equals(LocalDate.now())) {
        return true; // 오늘 첫 도망 시도
    }
    return fleeCount < 3;
}

public void recordFlee() {
    LocalDate today = LocalDate.now();
    if (fleeResetDate == null || !fleeResetDate.equals(today)) {
        this.fleeCount = 1;
        this.fleeResetDate = today;
    } else {
        this.fleeCount++;
    }
}
```

### Battle.java — 캐릭터 HP 필드 추가

```java
@Column(name = "current_character_hp", nullable = false)
private int currentCharacterHp;

public void damageCharacter(int damage) {
    this.currentCharacterHp = Math.max(0, this.currentCharacterHp - damage);
}

public boolean isCharacterDead() {
    return this.currentCharacterHp <= 0;
}
```

---

## API 상세

### POST /api/battles/start

**Request:**
```json
{ "monsterId": 1 }
```

**처리 흐름:**
1. 인증된 유저의 캐릭터 조회
2. Monster 조회
3. Battle 생성 (`currentMonsterHp = monster.hp`, `currentCharacterHp = 100 + character.level * 10`)
4. QuestionSelector로 첫 문제 선택 (question_history 기반 중복 방지)
5. QuestionHistory 저장
6. 응답 반환

**Response:**
```json
{
  "battleId": 1,
  "monsterName": "슬라임",
  "monsterMaxHp": 200,
  "monsterCurrentHp": 200,
  "characterMaxHp": 110,
  "characterCurrentHp": 110,
  "question": {
    "id": 5,
    "toeicPart": "PART2",
    "questionText": "Describe the picture.",
    "hint": "There is a person...",
    "prepTime": 30,
    "answerTime": 45
  }
}
```

---

### POST /api/battles/{id}/end (설계 제외 — /turn에서 처리)

CLAUDE.md에 `/end` 엔드포인트가 명시되어 있으나, 이 설계에서는 `/turn` 응답의 `battleEnded: true`로 종료를 처리한다. 프론트엔드가 종료 이후 추가 정리 작업을 별도로 요청해야 하는 경우 5단계 또는 6단계에서 추가한다.

---

### POST /api/battles/{id}/turn

**Request:**
```json
{
  "action": "ATTACK",
  "score": 85
}
```

- `score`: ATTACK, HINT 액션에 필수 (0~100). PASS/FLEE는 무시됨.

**처리 흐름:**
1. Battle 조회 (종료된 배틀이면 예외)
2. BattleDamageCalculator로 데미지 계산
3. BattleTurn 저장
4. Battle HP 업데이트
5. 종료 여부 판단 (몬스터 HP=0 → WIN, 캐릭터 HP=0 → LOSE, FLEE → FLEE)
6. 종료 시: 경험치/골드 지급, 레벨업 체크, ReviewQuestion 저장 (score ≤ 40)
7. 미종료 시: 다음 문제 선택, QuestionHistory 저장
8. 응답 반환

**Response:**
```json
{
  "turnNumber": 2,
  "action": "ATTACK",
  "score": 85,
  "damageDealt": 26,
  "damageTaken": 16,
  "isCritical": false,
  "monsterCurrentHp": 174,
  "characterCurrentHp": 94,
  "battleEnded": false,
  "result": null,
  "expGained": null,
  "goldGained": null,
  "nextQuestion": {
    "id": 7,
    "toeicPart": "PART2",
    "questionText": "...",
    "hint": "...",
    "prepTime": 30,
    "answerTime": 45
  }
}
```

배틀 종료 시 응답 예시:
```json
{
  "turnNumber": 4,
  "action": "ATTACK",
  "score": 100,
  "damageDealt": 50,
  "damageTaken": 0,
  "isCritical": true,
  "monsterCurrentHp": 0,
  "characterCurrentHp": 74,
  "battleEnded": true,
  "result": "WIN",
  "expGained": 100,
  "goldGained": 15,
  "nextQuestion": null
}
```

---

## BattleDamageCalculator 상세

### 공격 데미지 (ATTACK / HINT)

HINT는 score를 받아 동일한 공식으로 계산하되 multiplier에 0.8 패널티를 적용한다.

```java
// 기본 데미지 (Fluency 스탯 반영)
int baseDamage = 10 + (stats.getFluency() * 2);

// 점수 구간별 배율
double multiplier;
if      (score == 100)           multiplier = 1.5;
else if (score >= 80)            multiplier = 1.0;
else if (score >= 60)            multiplier = 0.7;
else if (score >= 40)            multiplier = 0.4;
else if (score >= 20)            multiplier = 0.1;
else                             multiplier = 0.0;

// HINT 패널티 (-20%)
if (action == HINT) multiplier *= 0.8;

int damageDealt = (int)(baseDamage * multiplier);

// 크리티컬 판정 (Vocabulary 스탯으로 임계점 하향)
// 기본: 100점만 크리티컬 / Vocabulary 5마다 임계점 -1 (최소 90)
int critThreshold = Math.max(90, 100 - (stats.getVocabulary() / 5));
boolean isCritical = (score >= critThreshold) && (multiplier >= 1.5 || score == 100);
// 단순화: 이 단계에서는 score == 100만 크리티컬로 처리, Vocabulary 보정은 TODO
boolean isCritical = (score == 100);
```

> **Vocabulary 크리티컬 확률 보정:** CLAUDE.md 명시 스펙이나 게임 밸런스 수치가 미확정이므로 이번 단계에서는 score == 100 고정. 7단계(성장 시스템) 구현 시 보정식을 추가한다.

### 몬스터 반격 데미지

```java
// 기본 반격 (Grammar 스탯으로 감소)
int baseCounter = Math.max(5, monster.getAttackPower() - (stats.getGrammar() * 2));

// 액션 보정
double counterMultiplier = switch(action) {
    PASS → 1.5
    ATTACK (score < 20) → 2.0
    default → 1.0
};
// FLEE는 반격 없음

int damageTaken = (int)(baseCounter * counterMultiplier);
```

---

## QuestionSelector 상세

```java
// 1. 해당 배틀 몬스터의 toeicPart에 맞는 활성 문제 전체 조회
// 2. 이 캐릭터의 QuestionHistory에 있는 문제 ID 제외
// 3. 이번 배틀에서 이미 출제된 문제 ID 제외
// 4. 남은 문제 중 랜덤 선택
// 5. 없으면 QuestionHistory 초기화 후 재선택 (모두 출제한 경우)
```

---

## 경험치/골드/레벨업 처리

`monster.expReward`는 CLAUDE.md 시드 데이터 기준으로 `HP × 0.5` (일반) / `HP × 1.0` (보스) 공식을 미리 계산한 값이다 (예: 슬라임 HP=200 → expReward=100). 런타임에 공식 재계산 불필요.

```java
// WIN
expGained = monster.getExpReward();
goldGained = monster.getGoldReward();

// LOSE
expGained = 50;  // 패배 위로 XP
goldGained = 0;

// FLEE
expGained = 0;
goldGained = 0;

// 레벨업 체크
long requiredExp = character.getLevel() * 200L;
while (character.getExp() >= requiredExp) {
    character.levelUp();  // level++, exp -= requiredExp
    requiredExp = character.getLevel() * 200L;
}
```

---

## 복습 등록 (ReviewQuestion)

ATTACK 액션에서 score ≤ 40인 경우:
- `ReviewQuestion` 저장 (character, question, battleTurn, originalScore)
- 이미 동일 question에 대한 미완료 ReviewQuestion이 있으면 중복 저장 안 함

---

## 오류 처리

| 상황 | HTTP 코드 | 메시지 |
|---|---|---|
| 존재하지 않는 Battle | 404 | "배틀을 찾을 수 없습니다" |
| 이미 종료된 Battle | 400 | "이미 종료된 배틀입니다" |
| 다른 유저의 Battle | 403 | "접근 권한이 없습니다" |
| FLEE 3회 초과 | 400 | "오늘 도망 횟수를 초과했습니다" |
| ATTACK/HINT인데 score 없음 | 400 | "해당 액션에는 점수가 필요합니다" |

---

## 완료 조건

- [ ] `Character`에 `fleeCount`, `fleeResetDate` 필드 추가 + `canFlee()`, `recordFlee()` 메서드
- [ ] `Battle`에 `currentCharacterHp` 필드 추가 + `damageCharacter()`, `isCharacterDead()` 메서드
- [ ] 5개 Repository 구현
- [ ] `BattleDamageCalculator` — 데미지 공식 단위 테스트 포함
- [ ] `QuestionSelector` — 중복 방지 로직 단위 테스트 포함
- [ ] `BattleService.startBattle()` — 배틀 생성, 첫 문제 선택
- [ ] `BattleService.processTurn()` — 4가지 액션 처리, HP 갱신, 종료 판단
- [ ] `BattleController` — POST /api/battles/start, POST /api/battles/{id}/turn
- [ ] 통합 테스트 (H2 기반): 배틀 시작 → 턴 진행 → WIN/LOSE/FLEE 각 시나리오
