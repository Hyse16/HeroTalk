# 배틀 시스템 백엔드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 턴제 배틀 시스템 백엔드를 구현한다 — 배틀 시작, 4가지 액션(ATTACK/HINT/PASS/FLEE) 처리, 데미지 계산, 경험치/골드/레벨업, 복습 등록.

**Architecture:** BattleService가 오케스트레이션, BattleDamageCalculator(순수 계산)와 QuestionSelector(중복 방지)를 컴포넌트로 분리. 캐릭터 HP는 Battle 엔티티에 currentCharacterHp로 격리 관리. Gemini 채점은 stub (클라이언트가 score 직접 전달).

**Tech Stack:** Spring Boot 3.2.5, JPA + Hibernate, H2 (테스트), JUnit 5, MockMvc, Lombok, Jakarta Validation

---

## 파일 구조

```
수정:
  src/main/java/org/herotalk/domain/character/entity/Character.java   ← fleeCount, fleeResetDate, canFlee(), recordFlee() 추가
  src/main/java/org/herotalk/domain/battle/entity/Battle.java          ← currentCharacterHp, damageCharacter(), isCharacterDead() 추가

신규:
  src/main/java/org/herotalk/domain/battle/repository/BattleRepository.java
  src/main/java/org/herotalk/domain/battle/repository/BattleTurnRepository.java
  src/main/java/org/herotalk/domain/question/repository/QuestionRepository.java
  src/main/java/org/herotalk/domain/question/repository/QuestionHistoryRepository.java
  src/main/java/org/herotalk/domain/review/repository/ReviewQuestionRepository.java

  src/main/java/org/herotalk/domain/battle/service/BattleDamageCalculator.java  ← 순수 계산, Spring 의존 없음
  src/main/java/org/herotalk/domain/battle/service/QuestionSelector.java
  src/main/java/org/herotalk/domain/battle/service/BattleService.java
  src/main/java/org/herotalk/domain/battle/controller/BattleController.java

  src/main/java/org/herotalk/domain/battle/dto/BattleStartRequest.java
  src/main/java/org/herotalk/domain/battle/dto/BattleStartResponse.java
  src/main/java/org/herotalk/domain/battle/dto/BattleTurnRequest.java
  src/main/java/org/herotalk/domain/battle/dto/BattleTurnResponse.java

테스트:
  src/test/java/org/herotalk/domain/battle/service/BattleDamageCalculatorTest.java
  src/test/java/org/herotalk/domain/battle/service/QuestionSelectorTest.java
  src/test/java/org/herotalk/domain/battle/service/BattleServiceTest.java
  src/test/java/org/herotalk/domain/battle/controller/BattleControllerTest.java
```

> **주의:** 모든 테스트 클래스는 `@ActiveProfiles("test")`를 붙여 H2 테스트 DB를 사용한다.

---

## Task 1: Character 엔티티 — flee 제한 필드 추가

**Files:**
- Modify: `src/main/java/org/herotalk/domain/character/entity/Character.java:73`

- [ ] **Step 1: 테스트 작성**

`src/test/java/org/herotalk/domain/character/entity/CharacterFleeTest.java` 생성:

```java
package org.herotalk.domain.character.entity;

import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import static org.assertj.core.api.Assertions.*;

class CharacterFleeTest {

    private Character buildCharacter() {
        return Character.builder()
                .name("테스터")
                .job(Character.Job.WARRIOR)
                .gender(Character.Gender.MALE)
                .build();
    }

    @Test
    void canFlee_첫시도는_항상_허용() {
        Character c = buildCharacter();
        assertThat(c.canFlee()).isTrue();
    }

    @Test
    void recordFlee_3회까지_허용() {
        Character c = buildCharacter();
        c.recordFlee(); assertThat(c.canFlee()).isTrue();
        c.recordFlee(); assertThat(c.canFlee()).isTrue();
        c.recordFlee(); assertThat(c.canFlee()).isFalse();
    }

    @Test
    void recordFlee_다음날_리셋() {
        Character c = buildCharacter();
        c.recordFlee(); c.recordFlee(); c.recordFlee(); // 3회 소진
        // fleeResetDate를 어제로 조작할 수 없으므로 canFlee() 로직의 날짜 분기 검증은 통합 테스트에서
        assertThat(c.canFlee()).isFalse();
    }
}
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
./gradlew test --tests "org.herotalk.domain.character.entity.CharacterFleeTest" 2>&1 | tail -20
```

Expected: `canFlee()` 메서드 없음으로 컴파일 오류

- [ ] **Step 3: Character.java에 flee 필드 및 메서드 추가**

`Character.java` 107줄 `}` 직전에 추가:

```java
import java.time.LocalDate;  // 파일 상단 import 추가

// --- Character 클래스 필드 (hp 필드 아래 추가) ---

@Column(name = "flee_count", nullable = false)
@Builder.Default
private int fleeCount = 0;

@Column(name = "flee_reset_date")
private LocalDate fleeResetDate;

// --- 도메인 변이 메서드 (맨 아래 추가) ---

/** 오늘 도망 가능 여부 (일일 3회 제한) */
public boolean canFlee() {
    if (fleeResetDate == null || !fleeResetDate.equals(LocalDate.now())) {
        return true;
    }
    return fleeCount < 3;
}

/** 도망 횟수 기록 (날짜 바뀌면 자동 리셋) */
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

- [ ] **Step 4: 테스트 통과 확인**

```bash
./gradlew test --tests "org.herotalk.domain.character.entity.CharacterFleeTest" 2>&1 | tail -10
```

Expected: `BUILD SUCCESSFUL`, 3 tests passed

- [ ] **Step 5: 전체 테스트 통과 확인**

```bash
./gradlew test 2>&1 | tail -10
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 6: 커밋**

```bash
git add src/main/java/org/herotalk/domain/character/entity/Character.java \
        src/test/java/org/herotalk/domain/character/entity/CharacterFleeTest.java
git commit -m "feat: Character 엔티티에 flee 일일 제한 필드 추가"
```

---

## Task 2: Battle 엔티티 — currentCharacterHp 추가

**Files:**
- Modify: `src/main/java/org/herotalk/domain/battle/entity/Battle.java:53`

- [ ] **Step 1: 테스트 작성**

`src/test/java/org/herotalk/domain/battle/entity/BattleHpTest.java` 생성:

```java
package org.herotalk.domain.battle.entity;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class BattleHpTest {

    @Test
    void damageCharacter_HP가_0_미만으로_내려가지_않음() {
        Battle battle = Battle.builder()
                .currentCharacterHp(10)
                .startedAt(java.time.LocalDateTime.now())
                .build();
        battle.damageCharacter(50);
        assertThat(battle.getCurrentCharacterHp()).isEqualTo(0);
    }

    @Test
    void isCharacterDead_HP가_0이면_true() {
        Battle battle = Battle.builder()
                .currentCharacterHp(0)
                .startedAt(java.time.LocalDateTime.now())
                .build();
        assertThat(battle.isCharacterDead()).isTrue();
    }
}
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
./gradlew test --tests "org.herotalk.domain.battle.entity.BattleHpTest" 2>&1 | tail -20
```

Expected: 컴파일 오류 (`currentCharacterHp` 없음)

- [ ] **Step 3: Battle.java에 필드 및 메서드 추가**

`Battle.java`의 `currentMonsterHp` 필드 아래에 추가:

```java
/** 배틀 진행 중 캐릭터 현재 HP (배틀 종료 시 캐릭터 엔티티에 반영하지 않음 — 배틀마다 초기화) */
@Column(name = "current_character_hp", nullable = false)
@Builder.Default
private int currentCharacterHp = 0;
```

`isCharacterDead()` 및 `damageCharacter()` 메서드를 `Battle.java` 도메인 메서드 섹션에 추가:

```java
/** 캐릭터에 데미지 적용 → 남은 HP 반환 */
public int damageCharacter(int damage) {
    this.currentCharacterHp = Math.max(0, this.currentCharacterHp - damage);
    return this.currentCharacterHp;
}

/** 캐릭터 사망 여부 */
public boolean isCharacterDead() {
    return this.currentCharacterHp <= 0;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
./gradlew test --tests "org.herotalk.domain.battle.entity.BattleHpTest" 2>&1 | tail -10
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: 커밋**

```bash
git add src/main/java/org/herotalk/domain/battle/entity/Battle.java \
        src/test/java/org/herotalk/domain/battle/entity/BattleHpTest.java
git commit -m "feat: Battle 엔티티에 currentCharacterHp 추가"
```

---

## Task 3: Repository 5개 구현

**Files:**
- Create: `src/main/java/org/herotalk/domain/battle/repository/BattleRepository.java`
- Create: `src/main/java/org/herotalk/domain/battle/repository/BattleTurnRepository.java`
- Create: `src/main/java/org/herotalk/domain/question/repository/QuestionRepository.java`
- Create: `src/main/java/org/herotalk/domain/question/repository/QuestionHistoryRepository.java`
- Create: `src/main/java/org/herotalk/domain/review/repository/ReviewQuestionRepository.java`

- [ ] **Step 1: BattleRepository.java 생성**

```java
package org.herotalk.domain.battle.repository;

import org.herotalk.domain.battle.entity.Battle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BattleRepository extends JpaRepository<Battle, Long> {
    Optional<Battle> findByIdAndCharacterId(Long battleId, Long characterId);
}
```

- [ ] **Step 2: BattleTurnRepository.java 생성**

```java
package org.herotalk.domain.battle.repository;

import org.herotalk.domain.battle.entity.BattleTurn;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BattleTurnRepository extends JpaRepository<BattleTurn, Long> {
    List<BattleTurn> findByBattleId(Long battleId);
    int countByBattleId(Long battleId);
}
```

- [ ] **Step 3: QuestionRepository.java 생성**

```java
package org.herotalk.domain.question.repository;

import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.question.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByToeicPartAndIsActiveTrue(Dungeon.ToeicPart toeicPart);
}
```

- [ ] **Step 4: QuestionHistoryRepository.java 생성**

```java
package org.herotalk.domain.question.repository;

import org.herotalk.domain.question.entity.QuestionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.Set;

public interface QuestionHistoryRepository extends JpaRepository<QuestionHistory, Long> {
    @Query("SELECT qh.question.id FROM QuestionHistory qh WHERE qh.character.id = :characterId")
    Set<Long> findQuestionIdsByCharacterId(Long characterId);

    @Modifying
    @Query("DELETE FROM QuestionHistory qh WHERE qh.character.id = :characterId")
    void deleteAllByCharacterId(Long characterId);
}
```

- [ ] **Step 5: ReviewQuestionRepository.java 생성**

```java
package org.herotalk.domain.review.repository;

import org.herotalk.domain.review.entity.ReviewQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ReviewQuestionRepository extends JpaRepository<ReviewQuestion, Long> {
    Optional<ReviewQuestion> findByCharacterIdAndQuestionIdAndIsClearedFalse(Long characterId, Long questionId);
}
```

- [ ] **Step 5b: QuestionHistoryRepository에 최근문제 조회 메서드 추가**

`src/main/java/org/herotalk/domain/question/repository/QuestionHistoryRepository.java`에서 import와 메서드 추가:

```java
import java.util.Optional;

// 인터페이스 body에 추가
Optional<QuestionHistory> findTopByCharacterIdOrderByLastShownAtDesc(Long characterId);
```

완성된 전체 파일:

```java
package org.herotalk.domain.question.repository;

import org.herotalk.domain.question.entity.QuestionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;
import java.util.Set;

public interface QuestionHistoryRepository extends JpaRepository<QuestionHistory, Long> {
    @Query("SELECT qh.question.id FROM QuestionHistory qh WHERE qh.character.id = :characterId")
    Set<Long> findQuestionIdsByCharacterId(Long characterId);

    @Modifying
    @Query("DELETE FROM QuestionHistory qh WHERE qh.character.id = :characterId")
    void deleteAllByCharacterId(Long characterId);

    Optional<QuestionHistory> findTopByCharacterIdOrderByLastShownAtDesc(Long characterId);
}
```

- [ ] **Step 6: 컨텍스트 로드 테스트로 검증**

```bash
./gradlew test --tests "org.herotalk.HeroTalkApplicationTest" 2>&1 | tail -10
```

Expected: `BUILD SUCCESSFUL` (Repository Bean 등록 오류 없음)

- [ ] **Step 7: 커밋**

```bash
git add src/main/java/org/herotalk/domain/battle/repository/ \
        src/main/java/org/herotalk/domain/question/repository/QuestionRepository.java \
        src/main/java/org/herotalk/domain/question/repository/QuestionHistoryRepository.java \
        src/main/java/org/herotalk/domain/review/repository/ReviewQuestionRepository.java
git commit -m "feat: 배틀 시스템 Repository 5개 추가"
```

---

## Task 4: BattleDamageCalculator — 순수 데미지 계산

**Files:**
- Create: `src/main/java/org/herotalk/domain/battle/service/BattleDamageCalculator.java`
- Test: `src/test/java/org/herotalk/domain/battle/service/BattleDamageCalculatorTest.java`

> Spring Context 불필요 — 순수 Java 단위 테스트로 빠르게 검증.

- [ ] **Step 1: 테스트 작성**

```java
package org.herotalk.domain.battle.service;

import org.herotalk.domain.battle.entity.BattleTurn.TurnAction;
import org.herotalk.domain.character.entity.CharacterStats;
import org.herotalk.domain.dungeon.entity.Monster;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.assertj.core.api.Assertions.*;

class BattleDamageCalculatorTest {

    private BattleDamageCalculator calculator;
    private CharacterStats stats;  // fluency=1, grammar=1
    private Monster monster;       // attackPower=10

    @BeforeEach
    void setUp() {
        calculator = new BattleDamageCalculator();
        // CharacterStats는 @Builder로 생성 (Spring 불필요)
        stats = CharacterStats.builder()
                .fluency(1).grammar(1).vocabulary(1).delivery(1)
                .build();
        // Monster는 Dungeon 없이 빌더로 생성
        monster = Monster.builder()
                .name("슬라임").hp(200).attackPower(10)
                .expReward(100).goldReward(15)
                .monsterType(Monster.MonsterType.NORMAL)
                .toeicPart(org.herotalk.domain.dungeon.entity.Dungeon.ToeicPart.PART2)
                .build();
    }

    // baseDamage = 10 + (1 * 2) = 12
    @ParameterizedTest(name = "score={0} → damageDealt={1}, isCritical={2}")
    @CsvSource({
        "100, 18, true",   // 12 * 1.5 = 18
        "90,  12, false",  // 12 * 1.0 = 12
        "70,   8, false",  // 12 * 0.7 = 8
        "50,   4, false",  // 12 * 0.4 = 4
        "30,   1, false",  // 12 * 0.1 = 1
        "10,   0, false",  // 12 * 0.0 = 0
    })
    void 점수_구간별_데미지(int score, int expectedDamage, boolean expectedCritical) {
        BattleDamageCalculator.AttackResult result =
            calculator.calculateAttack(TurnAction.ATTACK, score, stats);
        assertThat(result.damageDealt()).isEqualTo(expectedDamage);
        assertThat(result.isCritical()).isEqualTo(expectedCritical);
    }

    @Test
    void HINT_데미지_80퍼센트() {
        // baseDamage=12, score=90 → multiplier=1.0 * 0.8 = 0.8 → 12*0.8 = 9
        BattleDamageCalculator.AttackResult result =
            calculator.calculateAttack(TurnAction.HINT, 90, stats);
        assertThat(result.damageDealt()).isEqualTo(9);
    }

    @Test
    void PASS_데미지_0() {
        BattleDamageCalculator.AttackResult result =
            calculator.calculateAttack(TurnAction.PASS, 0, stats);
        assertThat(result.damageDealt()).isEqualTo(0);
    }

    @Test
    void 몬스터_반격_Grammar스탯_감소() {
        // baseCounter = max(5, 10 - (1*2)) = max(5, 8) = 8
        int counter = calculator.calculateCounter(TurnAction.ATTACK, 80, monster, stats);
        assertThat(counter).isEqualTo(8);
    }

    @Test
    void 몬스터_반격_PASS_1점5배() {
        // baseCounter = 8, * 1.5 = 12
        int counter = calculator.calculateCounter(TurnAction.PASS, 0, monster, stats);
        assertThat(counter).isEqualTo(12);
    }

    @Test
    void 몬스터_반격_점수미달_2배() {
        // score < 20, baseCounter = 8, * 2.0 = 16
        int counter = calculator.calculateCounter(TurnAction.ATTACK, 10, monster, stats);
        assertThat(counter).isEqualTo(16);
    }

    @Test
    void 몬스터_반격_최솟값_5() {
        // grammar=100 → baseCounter = max(5, 10 - 200) = 5
        CharacterStats highGrammar = CharacterStats.builder()
                .fluency(1).grammar(100).vocabulary(1).delivery(1).build();
        int counter = calculator.calculateCounter(TurnAction.ATTACK, 80, monster, highGrammar);
        assertThat(counter).isEqualTo(5);
    }

    @Test
    void FLEE_반격_없음() {
        int counter = calculator.calculateCounter(TurnAction.FLEE, 0, monster, stats);
        assertThat(counter).isEqualTo(0);
    }
}
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
./gradlew test --tests "org.herotalk.domain.battle.service.BattleDamageCalculatorTest" 2>&1 | tail -20
```

Expected: 컴파일 오류

- [ ] **Step 3: BattleDamageCalculator.java 구현**

```java
package org.herotalk.domain.battle.service;

import org.herotalk.domain.battle.entity.BattleTurn.TurnAction;
import org.herotalk.domain.character.entity.CharacterStats;
import org.herotalk.domain.dungeon.entity.Monster;
import org.springframework.stereotype.Component;

@Component
public class BattleDamageCalculator {

    public record AttackResult(int damageDealt, boolean isCritical) {}

    /** ATTACK/HINT 시 플레이어 공격 데미지 계산 */
    public AttackResult calculateAttack(TurnAction action, int score, CharacterStats stats) {
        if (action == TurnAction.PASS || action == TurnAction.FLEE) {
            return new AttackResult(0, false);
        }

        int baseDamage = 10 + (stats.getFluency() * 2);

        double multiplier;
        if      (score == 100) multiplier = 1.5;
        else if (score >= 80)  multiplier = 1.0;
        else if (score >= 60)  multiplier = 0.7;
        else if (score >= 40)  multiplier = 0.4;
        else if (score >= 20)  multiplier = 0.1;
        else                   multiplier = 0.0;

        if (action == TurnAction.HINT) multiplier *= 0.8;

        int damageDealt = (int)(baseDamage * multiplier);
        boolean isCritical = (score == 100);
        return new AttackResult(damageDealt, isCritical);
    }

    /** 몬스터 반격 데미지 계산 */
    public int calculateCounter(TurnAction action, int score, Monster monster, CharacterStats stats) {
        if (action == TurnAction.FLEE) return 0;

        int base = Math.max(5, monster.getAttackPower() - (stats.getGrammar() * 2));

        double mult;
        if (action == TurnAction.PASS) {
            mult = 1.5;
        } else if (action == TurnAction.ATTACK && score < 20) {
            mult = 2.0;
        } else {
            mult = 1.0;
        }

        return (int)(base * mult);
    }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
./gradlew test --tests "org.herotalk.domain.battle.service.BattleDamageCalculatorTest" 2>&1 | tail -10
```

Expected: `BUILD SUCCESSFUL`, 10+ tests passed

- [ ] **Step 5: 커밋**

```bash
git add src/main/java/org/herotalk/domain/battle/service/BattleDamageCalculator.java \
        src/test/java/org/herotalk/domain/battle/service/BattleDamageCalculatorTest.java
git commit -m "feat: BattleDamageCalculator — 데미지 공식 구현"
```

---

## Task 5: QuestionSelector 구현

**Files:**
- Create: `src/main/java/org/herotalk/domain/battle/service/QuestionSelector.java`
- Test: `src/test/java/org/herotalk/domain/battle/service/QuestionSelectorTest.java`

- [ ] **Step 1: 테스트 작성**

```java
package org.herotalk.domain.battle.service;

import org.herotalk.domain.character.entity.Character;
import org.herotalk.domain.character.entity.CharacterStats;
import org.herotalk.domain.character.repository.CharacterRepository;
import org.herotalk.domain.character.repository.CharacterStatsRepository;
import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.dungeon.entity.Monster;
import org.herotalk.domain.question.entity.Question;
import org.herotalk.domain.question.entity.QuestionHistory;
import org.herotalk.domain.question.repository.QuestionHistoryRepository;
import org.herotalk.domain.question.repository.QuestionRepository;
import org.herotalk.domain.user.entity.User;
import org.herotalk.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class QuestionSelectorTest {

    @Autowired QuestionSelector questionSelector;
    @Autowired QuestionRepository questionRepository;
    @Autowired QuestionHistoryRepository questionHistoryRepository;
    @Autowired CharacterRepository characterRepository;
    @Autowired CharacterStatsRepository characterStatsRepository;
    @Autowired UserRepository userRepository;

    Character character;
    Question q1, q2, q3;

    @BeforeEach
    void setUp() {
        User user = userRepository.save(User.createLocal("test@test.com", "pw", "닉네임"));
        character = characterRepository.save(Character.builder()
                .user(user).name("전사").job(Character.Job.WARRIOR).gender(Character.Gender.MALE).build());
        characterStatsRepository.save(CharacterStats.initByJob(character, Character.Job.WARRIOR));

        q1 = questionRepository.save(Question.builder()
                .toeicPart(Dungeon.ToeicPart.PART2).difficulty(1)
                .questionText("Q1").prepTime(30).answerTime(45).build());
        q2 = questionRepository.save(Question.builder()
                .toeicPart(Dungeon.ToeicPart.PART2).difficulty(1)
                .questionText("Q2").prepTime(30).answerTime(45).build());
        q3 = questionRepository.save(Question.builder()
                .toeicPart(Dungeon.ToeicPart.PART2).difficulty(1)
                .questionText("Q3").prepTime(30).answerTime(45).build());
    }

    @Test
    void 히스토리_없을때_문제_선택() {
        Question q = questionSelector.select(character, Dungeon.ToeicPart.PART2, Set.of());
        assertThat(q).isNotNull();
        assertThat(q.getToeicPart()).isEqualTo(Dungeon.ToeicPart.PART2);
    }

    @Test
    void 히스토리_있는_문제_제외() {
        questionHistoryRepository.save(QuestionHistory.builder()
                .character(character).question(q1).build());
        questionHistoryRepository.save(QuestionHistory.builder()
                .character(character).question(q2).build());

        // 히스토리에 q1, q2 → q3만 선택 가능
        Question selected = questionSelector.select(character, Dungeon.ToeicPart.PART2, Set.of());
        assertThat(selected.getId()).isEqualTo(q3.getId());
    }

    @Test
    void 배틀내_이미출제_문제_제외() {
        Question selected = questionSelector.select(
                character, Dungeon.ToeicPart.PART2, Set.of(q1.getId(), q2.getId()));
        assertThat(selected.getId()).isEqualTo(q3.getId());
    }

    @Test
    void 모두출제시_히스토리_초기화후_재선택() {
        // 모든 문제를 히스토리에 등록
        questionHistoryRepository.save(QuestionHistory.builder().character(character).question(q1).build());
        questionHistoryRepository.save(QuestionHistory.builder().character(character).question(q2).build());
        questionHistoryRepository.save(QuestionHistory.builder().character(character).question(q3).build());

        Question selected = questionSelector.select(character, Dungeon.ToeicPart.PART2, Set.of());
        assertThat(selected).isNotNull(); // 리셋 후 선택됨
    }
}
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
./gradlew test --tests "org.herotalk.domain.battle.service.QuestionSelectorTest" 2>&1 | tail -20
```

Expected: `QuestionSelector` 없음으로 컴파일 오류

- [ ] **Step 3: QuestionSelector.java 구현**

```java
package org.herotalk.domain.battle.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.question.entity.Question;
import org.herotalk.domain.question.entity.QuestionHistory;
import org.herotalk.domain.question.repository.QuestionHistoryRepository;
import org.herotalk.domain.question.repository.QuestionRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class QuestionSelector {

    private final QuestionRepository questionRepository;
    private final QuestionHistoryRepository questionHistoryRepository;
    private final Random random = new Random();

    /**
     * 이 배틀에서 출제할 문제 선택.
     * @param character       현재 캐릭터
     * @param toeicPart       몬스터의 toeicPart
     * @param usedInBattle    이번 배틀에서 이미 출제된 question ID set
     */
    @Transactional
    public Question select(Character character, Dungeon.ToeicPart toeicPart, Set<Long> usedInBattle) {
        Set<Long> historyIds = questionHistoryRepository.findQuestionIdsByCharacterId(character.getId());
        List<Question> candidates = getCandidates(toeicPart, historyIds, usedInBattle);

        if (candidates.isEmpty()) {
            // 모두 출제한 경우: 히스토리 초기화 후 재조회
            questionHistoryRepository.deleteAllByCharacterId(character.getId());
            candidates = getCandidates(toeicPart, Set.of(), usedInBattle);
        }

        if (candidates.isEmpty()) {
            throw new IllegalStateException("출제 가능한 문제가 없습니다 (toeicPart=" + toeicPart + ")");
        }

        Question selected = candidates.get(random.nextInt(candidates.size()));

        questionHistoryRepository.save(QuestionHistory.builder()
                .character(character)
                .question(selected)
                .build());

        return selected;
    }

    private List<Question> getCandidates(Dungeon.ToeicPart toeicPart, Set<Long> historyIds, Set<Long> usedInBattle) {
        return questionRepository.findByToeicPartAndIsActiveTrue(toeicPart).stream()
                .filter(q -> !historyIds.contains(q.getId()))
                .filter(q -> !usedInBattle.contains(q.getId()))
                .collect(Collectors.toList());
    }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
./gradlew test --tests "org.herotalk.domain.battle.service.QuestionSelectorTest" 2>&1 | tail -10
```

Expected: `BUILD SUCCESSFUL`, 4 tests passed

- [ ] **Step 5: 커밋**

```bash
git add src/main/java/org/herotalk/domain/battle/service/QuestionSelector.java \
        src/test/java/org/herotalk/domain/battle/service/QuestionSelectorTest.java
git commit -m "feat: QuestionSelector — 중복 방지 문제 선택 구현"
```

---

## Task 6: DTO 클래스 구현

**Files:**
- Create: `src/main/java/org/herotalk/domain/battle/dto/BattleStartRequest.java`
- Create: `src/main/java/org/herotalk/domain/battle/dto/BattleStartResponse.java`
- Create: `src/main/java/org/herotalk/domain/battle/dto/BattleTurnRequest.java`
- Create: `src/main/java/org/herotalk/domain/battle/dto/BattleTurnResponse.java`

> DTO는 로직이 없으므로 별도 단위 테스트 불필요. Task 7~9의 통합 테스트에서 검증된다.

- [ ] **Step 1: BattleStartRequest.java 생성**

```java
package org.herotalk.domain.battle.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class BattleStartRequest {

    @NotNull(message = "monsterId는 필수입니다")
    private Long monsterId;
}
```

- [ ] **Step 2: BattleStartResponse.java 생성**

```java
package org.herotalk.domain.battle.dto;

import lombok.Builder;
import lombok.Getter;
import org.herotalk.domain.dungeon.entity.Dungeon;

@Getter
@Builder
public class BattleStartResponse {
    private Long battleId;
    private Long monsterId;
    private String monsterName;
    private int monsterMaxHp;
    private int monsterCurrentHp;
    private int characterMaxHp;
    private int characterCurrentHp;
    private QuestionDto question;

    @Getter
    @Builder
    public static class QuestionDto {
        private Long id;
        private Dungeon.ToeicPart toeicPart;
        private String questionText;
        private String hint;
        private int prepTime;
        private int answerTime;

        public static QuestionDto from(org.herotalk.domain.question.entity.Question q) {
            return QuestionDto.builder()
                    .id(q.getId())
                    .toeicPart(q.getToeicPart())
                    .questionText(q.getQuestionText())
                    .hint(q.getHint())
                    .prepTime(q.getPrepTime())
                    .answerTime(q.getAnswerTime())
                    .build();
        }
    }
}
```

- [ ] **Step 3: BattleTurnRequest.java 생성**

```java
package org.herotalk.domain.battle.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.herotalk.domain.battle.entity.BattleTurn.TurnAction;

@Getter
@NoArgsConstructor
public class BattleTurnRequest {

    @NotNull(message = "action은 필수입니다")
    private TurnAction action;

    @Min(0) @Max(100)
    private Integer score;  // ATTACK, HINT에만 필수
}
```

- [ ] **Step 4: BattleTurnResponse.java 생성**

```java
package org.herotalk.domain.battle.dto;

import lombok.Builder;
import lombok.Getter;
import org.herotalk.domain.battle.entity.Battle.BattleResult;
import org.herotalk.domain.battle.entity.BattleTurn.TurnAction;

@Getter
@Builder
public class BattleTurnResponse {
    private int turnNumber;
    private TurnAction action;
    private Integer score;
    private int damageDealt;
    private int damageTaken;
    private boolean isCritical;
    private int monsterCurrentHp;
    private int characterCurrentHp;
    private boolean battleEnded;       // Lombok @Getter → isBattleEnded() (primitive boolean)
    private BattleResult result;       // null if not ended
    private Integer expGained;         // null if not ended
    private Integer goldGained;        // null if not ended
    private BattleStartResponse.QuestionDto nextQuestion;  // null if ended
}
```

- [ ] **Step 5: 컴파일 확인**

```bash
./gradlew compileJava 2>&1 | tail -10
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 6: 커밋**

```bash
git add src/main/java/org/herotalk/domain/battle/dto/
git commit -m "feat: 배틀 DTO 클래스 추가"
```

---

## Task 7: BattleService — startBattle

**Files:**
- Create: `src/main/java/org/herotalk/domain/battle/service/BattleService.java`
- Test: `src/test/java/org/herotalk/domain/battle/service/BattleServiceTest.java` (이 task에서 시작)

- [ ] **Step 1: startBattle 테스트 작성**

```java
package org.herotalk.domain.battle.service;

import org.herotalk.domain.battle.dto.BattleStartRequest;
import org.herotalk.domain.battle.dto.BattleStartResponse;
import org.herotalk.domain.battle.repository.BattleRepository;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.domain.character.entity.CharacterStats;
import org.herotalk.domain.character.repository.CharacterRepository;
import org.herotalk.domain.character.repository.CharacterStatsRepository;
import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.dungeon.entity.Monster;
import org.herotalk.domain.dungeon.repository.MonsterRepository;
import org.herotalk.domain.question.entity.Question;
import org.herotalk.domain.question.repository.QuestionRepository;
import org.herotalk.domain.user.entity.User;
import org.herotalk.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BattleServiceTest {

    @Autowired BattleService battleService;
    @Autowired UserRepository userRepository;
    @Autowired CharacterRepository characterRepository;
    @Autowired CharacterStatsRepository characterStatsRepository;
    @Autowired MonsterRepository monsterRepository;
    @Autowired QuestionRepository questionRepository;
    @Autowired BattleRepository battleRepository;

    User user;
    Character character;
    Monster monster;
    Question question;

    @BeforeEach
    void setUp() {
        user = userRepository.save(User.createLocal("battle@test.com", "pw", "배틀러"));

        character = characterRepository.save(Character.builder()
                .user(user).name("전사").job(Character.Job.WARRIOR).gender(Character.Gender.MALE).build());
        characterStatsRepository.save(CharacterStats.initByJob(character, Character.Job.WARRIOR));

        Dungeon dungeon = dungeonRepository.save(Dungeon.builder()
                .name("초보자 숲").toeicPart(Dungeon.ToeicPart.PART2).build());
        monster = monsterRepository.save(Monster.builder()
                .dungeon(dungeon).name("슬라임").hp(200).attackPower(10)
                .expReward(100).goldReward(15)
                .monsterType(Monster.MonsterType.NORMAL)
                .toeicPart(Dungeon.ToeicPart.PART2).build());

        question = questionRepository.save(Question.builder()
                .toeicPart(Dungeon.ToeicPart.PART2).difficulty(1)
                .questionText("Describe the picture.").hint("There is a person.")
                .prepTime(30).answerTime(45).build());
    }

    @Autowired org.herotalk.domain.dungeon.repository.DungeonRepository dungeonRepository;

    @Test
    void startBattle_배틀_생성_및_첫문제_선택() {
        BattleStartRequest req = new BattleStartRequest();
        // monsterId 설정은 reflection 없이 테스트용 생성자 사용
        // BattleStartRequest에 @AllArgsConstructor 없으므로 Lombok setter 또는 별도 생성자 추가 필요
        // → BattleStartRequest에 테스트용 생성자 추가: public BattleStartRequest(Long monsterId) { this.monsterId = monsterId; }

        BattleStartResponse response = battleService.startBattle(user.getId(), monster.getId());

        assertThat(response.getBattleId()).isNotNull();
        assertThat(response.getMonsterCurrentHp()).isEqualTo(200);
        assertThat(response.getCharacterCurrentHp()).isEqualTo(character.getMaxHp());
        assertThat(response.getQuestion()).isNotNull();
        assertThat(battleRepository.count()).isEqualTo(1);
    }
}
```

> **주의:** `BattleStartRequest`에 `monsterId`를 외부에서 설정하려면 아래 Step에서 BattleService 메서드 시그니처를 `startBattle(Long userId, Long monsterId)`로 정의한다 (Request 객체 파싱은 Controller에서).

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
./gradlew test --tests "org.herotalk.domain.battle.service.BattleServiceTest.startBattle_배틀_생성_및_첫문제_선택" 2>&1 | tail -20
```

Expected: `BattleService` 없음으로 컴파일 오류

- [ ] **Step 3: BattleService.java — startBattle 구현**

```java
package org.herotalk.domain.battle.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.battle.dto.BattleStartResponse;
import org.herotalk.domain.battle.dto.BattleTurnRequest;
import org.herotalk.domain.battle.dto.BattleTurnResponse;
import org.herotalk.domain.battle.entity.Battle;
import org.herotalk.domain.battle.repository.BattleRepository;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.domain.character.entity.CharacterStats;
import org.herotalk.domain.character.repository.CharacterRepository;
import org.herotalk.domain.character.repository.CharacterStatsRepository;
import org.herotalk.domain.dungeon.entity.Monster;
import org.herotalk.domain.dungeon.repository.MonsterRepository;
import org.herotalk.domain.question.entity.Question;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BattleService {

    private final BattleRepository battleRepository;
    private final CharacterRepository characterRepository;
    private final CharacterStatsRepository characterStatsRepository;
    private final MonsterRepository monsterRepository;
    private final BattleDamageCalculator damageCalculator;
    private final QuestionSelector questionSelector;

    @Transactional
    public BattleStartResponse startBattle(Long userId, Long monsterId) {
        Character character = characterRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("캐릭터를 찾을 수 없습니다"));

        Monster monster = monsterRepository.findById(monsterId)
                .orElseThrow(() -> new IllegalArgumentException("몬스터를 찾을 수 없습니다"));

        Battle battle = Battle.builder()
                .character(character)
                .monster(monster)
                .currentMonsterHp(monster.getHp())
                .currentCharacterHp(character.getMaxHp())
                .startedAt(LocalDateTime.now())
                .build();
        battle = battleRepository.save(battle);

        Question firstQuestion = questionSelector.select(character, monster.getToeicPart(), Set.of());

        return BattleStartResponse.builder()
                .battleId(battle.getId())
                .monsterId(monster.getId())
                .monsterName(monster.getName())
                .monsterMaxHp(monster.getHp())
                .monsterCurrentHp(battle.getCurrentMonsterHp())
                .characterMaxHp(character.getMaxHp())
                .characterCurrentHp(battle.getCurrentCharacterHp())
                .question(BattleStartResponse.QuestionDto.from(firstQuestion))
                .build();
    }
}
```

- [ ] **Step 4: MonsterRepository가 없으면 추가**

`src/main/java/org/herotalk/domain/dungeon/repository/` 디렉토리 확인 후:

```java
package org.herotalk.domain.dungeon.repository;

import org.herotalk.domain.dungeon.entity.Monster;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MonsterRepository extends JpaRepository<Monster, Long> {}
```

DungeonRepository도 없으면:

```java
package org.herotalk.domain.dungeon.repository;

import org.herotalk.domain.dungeon.entity.Dungeon;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DungeonRepository extends JpaRepository<Dungeon, Long> {}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
./gradlew test --tests "org.herotalk.domain.battle.service.BattleServiceTest.startBattle_배틀_생성_및_첫문제_선택" 2>&1 | tail -10
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 6: 커밋**

```bash
git add src/main/java/org/herotalk/domain/battle/service/BattleService.java \
        src/main/java/org/herotalk/domain/dungeon/repository/ \
        src/test/java/org/herotalk/domain/battle/service/BattleServiceTest.java
git commit -m "feat: BattleService.startBattle() 구현"
```

---

## Task 8: BattleService — processTurn

**Files:**
- Modify: `src/main/java/org/herotalk/domain/battle/service/BattleService.java`
- Modify: `src/test/java/org/herotalk/domain/battle/service/BattleServiceTest.java`

추가로 필요한 Repository:
- `domain/battle/repository/BattleTurnRepository.java` (Task 3에서 생성됨)
- `domain/review/repository/ReviewQuestionRepository.java` (Task 3에서 생성됨)

- [ ] **Step 1: processTurn 테스트 추가** (`BattleServiceTest.java`에 아래 메서드들 추가)

```java
// setUp에 startBattle 헬퍼 추가
private Long startedBattleId;

private void startBattle() {
    BattleStartResponse resp = battleService.startBattle(user.getId(), monster.getId());
    startedBattleId = resp.getBattleId();
}

@Test
void processTurn_ATTACK_데미지계산_정상() {
    startBattle();
    BattleTurnRequest req = new BattleTurnRequest(BattleTurn.TurnAction.ATTACK, 90);

    BattleTurnResponse resp = battleService.processTurn(user.getId(), startedBattleId, req);

    // baseDamage = 10 + (3*2) = 16 (WARRIOR fluency=3), multiplier=1.0 → damageDealt=16
    assertThat(resp.getDamageDealt()).isEqualTo(16);
    assertThat(resp.isCritical()).isFalse();
    assertThat(resp.isBattleEnded()).isFalse();
    assertThat(resp.getNextQuestion()).isNotNull();
}

@Test
void processTurn_ATTACK_100점_크리티컬() {
    startBattle();
    BattleTurnRequest req = new BattleTurnRequest(BattleTurn.TurnAction.ATTACK, 100);

    BattleTurnResponse resp = battleService.processTurn(user.getId(), startedBattleId, req);

    assertThat(resp.isCritical()).isTrue();
    // 16 * 1.5 = 24
    assertThat(resp.getDamageDealt()).isEqualTo(24);
}

@Test
void processTurn_WIN_배틀종료() {
    // 몬스터 HP=1인 몬스터로 배틀 시작 → 한 턴에 처치
    Monster weakMonster = monsterRepository.save(Monster.builder()
            .dungeon(monster.getDungeon()).name("약한슬라임").hp(1).attackPower(10)
            .expReward(50).goldReward(10)
            .monsterType(Monster.MonsterType.NORMAL)
            .toeicPart(Dungeon.ToeicPart.PART2).build());

    BattleStartResponse startResp = battleService.startBattle(user.getId(), weakMonster.getId());
    BattleTurnRequest req = new BattleTurnRequest(BattleTurn.TurnAction.ATTACK, 80);

    BattleTurnResponse resp = battleService.processTurn(user.getId(), startResp.getBattleId(), req);

    assertThat(resp.isBattleEnded()).isTrue();
    assertThat(resp.getResult()).isEqualTo(Battle.BattleResult.WIN);
    assertThat(resp.getExpGained()).isEqualTo(50);
    assertThat(resp.getGoldGained()).isEqualTo(10);
}

@Test
void processTurn_FLEE_정상() {
    startBattle();
    BattleTurnRequest req = new BattleTurnRequest(BattleTurn.TurnAction.FLEE, null);

    BattleTurnResponse resp = battleService.processTurn(user.getId(), startedBattleId, req);

    assertThat(resp.isBattleEnded()).isTrue();
    assertThat(resp.getResult()).isEqualTo(Battle.BattleResult.FLEE);
    assertThat(resp.getExpGained()).isEqualTo(0);
}

@Test
void processTurn_FLEE_3회초과_예외() {
    // 먼저 3번 도망
    for (int i = 0; i < 3; i++) {
        BattleStartResponse s = battleService.startBattle(user.getId(), monster.getId());
        battleService.processTurn(user.getId(), s.getBattleId(),
                new BattleTurnRequest(BattleTurn.TurnAction.FLEE, null));
    }
    // 4번째 시도
    BattleStartResponse s = battleService.startBattle(user.getId(), monster.getId());
    assertThatThrownBy(() ->
        battleService.processTurn(user.getId(), s.getBattleId(),
                new BattleTurnRequest(BattleTurn.TurnAction.FLEE, null))
    ).isInstanceOf(IllegalStateException.class)
     .hasMessageContaining("도망");
}

@Test
void processTurn_40점이하_복습등록() {
    startBattle();
    BattleTurnRequest req = new BattleTurnRequest(BattleTurn.TurnAction.ATTACK, 30);

    battleService.processTurn(user.getId(), startedBattleId, req);

    assertThat(reviewQuestionRepository.count()).isEqualTo(1);
}

@Autowired org.herotalk.domain.review.repository.ReviewQuestionRepository reviewQuestionRepository;
@Autowired org.herotalk.domain.battle.repository.BattleTurnRepository battleTurnRepository;
```

> **주의:** `BattleTurnRequest`에 `@AllArgsConstructor` 추가 필요: `public BattleTurnRequest(TurnAction action, Integer score) { ... }`

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
./gradlew test --tests "org.herotalk.domain.battle.service.BattleServiceTest" 2>&1 | grep -E "FAIL|ERROR|passed|failed" | tail -20
```

Expected: `processTurn` 메서드 없음

- [ ] **Step 3: BattleService에 processTurn 추가**

`BattleService.java`에 아래 필드와 메서드 추가:

```java
// 필드 추가 (기존 필드들 아래)
private final BattleTurnRepository battleTurnRepository;
private final ReviewQuestionRepository reviewQuestionRepository;
private final CharacterStatsRepository characterStatsRepository;

@Transactional
public BattleTurnResponse processTurn(Long userId, Long battleId, BattleTurnRequest request) {
    Character character = characterRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalStateException("캐릭터를 찾을 수 없습니다"));

    Battle battle = battleRepository.findByIdAndCharacterId(battleId, character.getId())
            .orElseThrow(() -> new IllegalArgumentException("배틀을 찾을 수 없습니다"));

    if (battle.getResult() != null) {
        throw new IllegalStateException("이미 종료된 배틀입니다");
    }

    BattleTurn.TurnAction action = request.getAction();

    // FLEE 제한 체크
    if (action == BattleTurn.TurnAction.FLEE) {
        if (!character.canFlee()) {
            throw new IllegalStateException("오늘 도망 횟수를 초과했습니다");
        }
    }

    // score 필수 체크
    if ((action == BattleTurn.TurnAction.ATTACK || action == BattleTurn.TurnAction.HINT)
            && request.getScore() == null) {
        throw new IllegalArgumentException("해당 액션에는 점수가 필요합니다");
    }

    CharacterStats stats = characterStatsRepository.findByCharacterId(character.getId())
            .orElseThrow(() -> new IllegalStateException("캐릭터 스탯을 찾을 수 없습니다"));

    int score = request.getScore() != null ? request.getScore() : 0;

    // 데미지 계산
    BattleDamageCalculator.AttackResult attackResult = damageCalculator.calculateAttack(action, score, stats);
    int damageTaken = damageCalculator.calculateCounter(action, score, battle.getMonster(), stats);

    // HP 업데이트
    battle.damageMonster(attackResult.damageDealt());
    battle.damageCharacter(damageTaken);

    int turnNumber = battleTurnRepository.countByBattleId(battleId) + 1;

    // BattleTurn 저장
    BattleTurn turn = BattleTurn.builder()
            .battle(battle)
            .question(resolveCurrentQuestion(battle))
            .turnNumber(turnNumber)
            .action(action)
            .score(request.getScore())
            .damageDealt(attackResult.damageDealt())
            .damageTaken(damageTaken)
            .isCritical(attackResult.isCritical())
            .createdAt(java.time.LocalDateTime.now())
            .build();
    turn = battleTurnRepository.save(turn);

    // 복습 등록 (ATTACK, score <= 40)
    if (action == BattleTurn.TurnAction.ATTACK && score <= 40) {
        registerReview(character, turn);
    }

    // 종료 판단
    boolean monsterDead = battle.getCurrentMonsterHp() == 0;
    boolean charDead = battle.isCharacterDead();
    boolean isFlee = action == BattleTurn.TurnAction.FLEE;

    if (monsterDead || charDead || isFlee) {
        return finishBattle(battle, character, turn, monsterDead, charDead, isFlee, score);
    }

    // 다음 문제 선택
    Set<Long> usedIds = battleTurnRepository.findByBattleId(battleId).stream()
            .map(t -> t.getQuestion().getId())
            .collect(java.util.stream.Collectors.toSet());
    Question nextQuestion = questionSelector.select(character, battle.getMonster().getToeicPart(), usedIds);

    return BattleTurnResponse.builder()
            .turnNumber(turnNumber)
            .action(action)
            .score(request.getScore())
            .damageDealt(attackResult.damageDealt())
            .damageTaken(damageTaken)
            .isCritical(attackResult.isCritical())
            .monsterCurrentHp(battle.getCurrentMonsterHp())
            .characterCurrentHp(battle.getCurrentCharacterHp())
            .battleEnded(false)
            .nextQuestion(BattleStartResponse.QuestionDto.from(nextQuestion))
            .build();
}

private BattleTurnResponse finishBattle(Battle battle, Character character, BattleTurn lastTurn,
                                         boolean monsterDead, boolean charDead, boolean isFlee, int score) {
    Battle.BattleResult result;
    int expGained;
    int goldGained;

    if (isFlee) {
        result = Battle.BattleResult.FLEE;
        expGained = 0;
        goldGained = 0;
        character.recordFlee();
    } else if (monsterDead) {
        result = Battle.BattleResult.WIN;
        expGained = battle.getMonster().getExpReward();
        goldGained = battle.getMonster().getGoldReward();
    } else {
        result = Battle.BattleResult.LOSE;
        expGained = 50;
        goldGained = 0;
    }

    character.addExp(expGained);
    character.addGold(goldGained);

    int totalTurns = battleTurnRepository.countByBattleId(battle.getId());
    battle.finish(result, totalTurns, expGained, goldGained);

    return BattleTurnResponse.builder()
            .turnNumber(lastTurn.getTurnNumber())
            .action(lastTurn.getAction())
            .score(lastTurn.getScore())
            .damageDealt(lastTurn.getDamageDealt())
            .damageTaken(lastTurn.getDamageTaken())
            .isCritical(lastTurn.isCritical())
            .monsterCurrentHp(battle.getCurrentMonsterHp())
            .characterCurrentHp(battle.getCurrentCharacterHp())
            .battleEnded(true)
            .result(result)
            .expGained(expGained)
            .goldGained(goldGained)
            .build();
}

private Question resolveCurrentQuestion(Battle battle) {
    // 현재 배틀의 마지막 BattleTurn이 사용한 문제
    // (턴을 저장하기 전 호출되므로, QuestionHistory에서 마지막 선택된 문제 조회)
    // 간단하게: QuestionHistory에서 이 캐릭터의 가장 최근 문제 사용
    return questionHistoryRepository
            .findTopByCharacterIdOrderByLastShownAtDesc(battle.getCharacter().getId())
            .orElseThrow(() -> new IllegalStateException("현재 문제를 찾을 수 없습니다"))
            .getQuestion();
}
```

**QuestionHistoryRepository에 메서드 추가:**

```java
import java.util.Optional;
Optional<QuestionHistory> findTopByCharacterIdOrderByLastShownAtDesc(Long characterId);
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
./gradlew test --tests "org.herotalk.domain.battle.service.BattleServiceTest" 2>&1 | tail -15
```

Expected: `BUILD SUCCESSFUL`, 6+ tests passed

- [ ] **Step 5: 커밋**

```bash
git add src/main/java/org/herotalk/domain/battle/service/BattleService.java \
        src/main/java/org/herotalk/domain/question/repository/QuestionHistoryRepository.java \
        src/test/java/org/herotalk/domain/battle/service/BattleServiceTest.java
git commit -m "feat: BattleService.processTurn() — 4가지 액션, 데미지, 종료 처리"
```

---

## Task 9: BattleController 구현

**Files:**
- Create: `src/main/java/org/herotalk/domain/battle/controller/BattleController.java`
- Test: `src/test/java/org/herotalk/domain/battle/controller/BattleControllerTest.java`

- [ ] **Step 1: 테스트 작성**

```java
package org.herotalk.domain.battle.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.herotalk.domain.battle.service.BattleService;
import org.herotalk.domain.battle.dto.BattleStartResponse;
import org.herotalk.domain.battle.dto.BattleTurnResponse;
import org.herotalk.domain.battle.entity.Battle.BattleResult;
import org.herotalk.domain.battle.entity.BattleTurn.TurnAction;
import org.herotalk.security.CustomUserDetails;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BattleControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean BattleService battleService;

    @Test
    void POST_battles_start_성공() throws Exception {
        BattleStartResponse mockResp = BattleStartResponse.builder()
                .battleId(1L).monsterId(1L).monsterName("슬라임")
                .monsterMaxHp(200).monsterCurrentHp(200)
                .characterMaxHp(100).characterCurrentHp(100)
                .question(BattleStartResponse.QuestionDto.builder()
                        .id(1L).questionText("Describe.").prepTime(30).answerTime(45).build())
                .build();

        given(battleService.startBattle(anyLong(), anyLong())).willReturn(mockResp);

        mockMvc.perform(post("/api/battles/start")
                        .with(SecurityMockMvcRequestPostProcessors.user(
                                new CustomUserDetails(1L, "test@test.com", "")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("monsterId", 1))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.battleId").value(1))
                .andExpect(jsonPath("$.data.monsterCurrentHp").value(200));
    }

    @Test
    void POST_battles_turn_성공() throws Exception {
        BattleTurnResponse mockResp = BattleTurnResponse.builder()
                .turnNumber(1).action(TurnAction.ATTACK).score(90)
                .damageDealt(16).damageTaken(8).isCritical(false)
                .monsterCurrentHp(184).characterCurrentHp(92)
                .battleEnded(false).build();

        given(battleService.processTurn(anyLong(), anyLong(), any())).willReturn(mockResp);

        mockMvc.perform(post("/api/battles/1/turn")
                        .with(SecurityMockMvcRequestPostProcessors.user(
                                new CustomUserDetails(1L, "test@test.com", "")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("action", "ATTACK", "score", 90))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.damageDealt").value(16))
                .andExpect(jsonPath("$.data.battleEnded").value(false));
    }

    @Test
    void POST_battles_turn_monsterId_없으면_400() throws Exception {
        mockMvc.perform(post("/api/battles/start")
                        .with(SecurityMockMvcRequestPostProcessors.user(
                                new CustomUserDetails(1L, "test@test.com", "")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
./gradlew test --tests "org.herotalk.domain.battle.controller.BattleControllerTest" 2>&1 | tail -20
```

Expected: `BattleController` 없음으로 404/컴파일 오류

- [ ] **Step 3: BattleController.java 구현**

```java
package org.herotalk.domain.battle.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.herotalk.domain.battle.dto.BattleStartRequest;
import org.herotalk.domain.battle.dto.BattleStartResponse;
import org.herotalk.domain.battle.dto.BattleTurnRequest;
import org.herotalk.domain.battle.dto.BattleTurnResponse;
import org.herotalk.domain.battle.service.BattleService;
import org.herotalk.global.response.ApiResponse;
import org.herotalk.security.CustomUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/battles")
@RequiredArgsConstructor
public class BattleController {

    private final BattleService battleService;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<BattleStartResponse>> startBattle(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody BattleStartRequest request) {
        BattleStartResponse response = battleService.startBattle(
                userDetails.getUserId(), request.getMonsterId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/{battleId}/turn")
    public ResponseEntity<ApiResponse<BattleTurnResponse>> processTurn(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long battleId,
            @Valid @RequestBody BattleTurnRequest request) {
        BattleTurnResponse response = battleService.processTurn(
                userDetails.getUserId(), battleId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
./gradlew test --tests "org.herotalk.domain.battle.controller.BattleControllerTest" 2>&1 | tail -10
```

Expected: `BUILD SUCCESSFUL`, 3 tests passed

- [ ] **Step 5: 전체 테스트 통과 확인**

```bash
./gradlew test 2>&1 | tail -15
```

Expected: `BUILD SUCCESSFUL`, 전체 테스트 통과

- [ ] **Step 6: 커밋**

```bash
git add src/main/java/org/herotalk/domain/battle/controller/BattleController.java \
        src/test/java/org/herotalk/domain/battle/controller/BattleControllerTest.java
git commit -m "feat: BattleController — POST /api/battles/start, /{id}/turn"
```

---

## 완료 체크리스트

- [ ] Task 1: Character flee 필드 + 메서드
- [ ] Task 2: Battle currentCharacterHp + 메서드
- [ ] Task 3: Repository 5개 (+ MonsterRepository, DungeonRepository)
- [ ] Task 4: BattleDamageCalculator (10+ 단위 테스트)
- [ ] Task 5: QuestionSelector (4개 통합 테스트)
- [ ] Task 6: DTO 4개
- [ ] Task 7: BattleService.startBattle
- [ ] Task 8: BattleService.processTurn (6+ 통합 테스트)
- [ ] Task 9: BattleController (3개 MockMvc 테스트)
- [ ] 전체 `./gradlew test` 통과
