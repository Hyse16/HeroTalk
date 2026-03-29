# HeroTalk Full Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 토익스피킹 실전 대비 2D RPG 웹 게임 HeroTalk의 미구현 기능 전체를 TDD 기반으로 구현한다.

**Architecture:** Spring Boot 3.2.5 REST API + React 18 + Phaser 3. JWT Stateless 인증, JPA dirty-checking으로 트랜잭션 내 엔티티 변이, Gemini Flash API AI 채점, Redis Sorted Set 랭킹. 프론트는 Vite + Zustand + Axios로 백엔드와 통신.

**Tech Stack:** Java 17, Spring Boot 3.2.5, Gradle 8.5 (Kotlin DSL), jjwt 0.12.3, JPA/Hibernate 6, QueryDSL 5, H2(test)/MySQL 8, Redis 7, React 18, Phaser 3, Vite, Zustand, Axios, Web Speech API

---

## 현재 완료 상태

| 항목 | 상태 |
|------|------|
| 백엔드 환경 세팅 | ✅ |
| JPA Entity 18개 (ERD 전체) | ✅ (Character/Battle 도메인 메서드 추가 완료) |
| JWT 인증 (JwtProvider, JwtAuthenticationFilter) | ✅ |
| Spring Security (CORS, Stateless, OAuth2) | ✅ |
| OAuth2 소셜 로그인 (Kakao, Google) | ✅ |
| Auth API (signup, login, refresh) | ✅ |
| Character API (create, getMe) | ✅ |
| 프론트엔드 환경 (Vite, Phaser 3, Zustand, Axios) | ✅ |
| 로그인 페이지 UI (다크 판타지 테마) | ✅ |

## 미구현 범위 (이 플랜의 대상)

1. Auth/Character 통합 테스트 (기존 코드 TDD 검증)
2. QuestionService (랜덤 출제, 중복 방지)
3. Gemini Flash API 채점 서비스
4. 배틀 시스템 백엔드 (시작/턴/종료)
5. 프론트엔드 API 레이어 + Zustand 스토어
6. 캐릭터 생성 페이지
7. 배틀 페이지 (마이크 STT, HP바, 타이머, 점수 팝업)
8. Redis 글로벌/주간 랭킹
9. Phaser FieldScene (WASD 이동)

---

## 파일 구조 맵

### 백엔드 신규/수정

```
src/main/java/org/herotalk/
├── security/util/
│   └── SecurityUtil.java                          # NEW: 현재 로그인 userId 추출
├── domain/
│   ├── question/
│   │   ├── repository/QuestionRepository.java     # NEW
│   │   ├── repository/QuestionHistoryRepository.java # NEW
│   │   └── service/QuestionService.java           # NEW: 랜덤 문제 출제 (중복 방지)
│   ├── ai/
│   │   ├── dto/ScoreRequest.java                  # NEW
│   │   ├── dto/ScoreResponse.java                 # NEW
│   │   └── GeminiClient.java                      # NEW: Gemini Flash API 클라이언트
│   ├── battle/
│   │   ├── repository/BattleRepository.java       # NEW
│   │   ├── repository/BattleTurnRepository.java   # NEW
│   │   ├── dto/BattleStartRequest.java            # NEW
│   │   ├── dto/BattleStartResponse.java           # NEW
│   │   ├── dto/BattleTurnRequest.java             # NEW
│   │   ├── dto/BattleTurnResponse.java            # NEW
│   │   ├── service/BattleService.java             # NEW
│   │   └── controller/BattleController.java       # NEW
│   └── dungeon/
│       └── repository/MonsterRepository.java      # NEW (Monster는 dungeon 패키지)
├── ranking/
│   ├── RankingService.java                        # NEW: Redis Sorted Set 랭킹
│   └── RankingController.java                     # NEW: GET /api/rankings/*

src/main/resources/
├── application.yml                                # MODIFY: gemini, app.frontend-url 추가
├── application-local.yml                          # MODIFY: gemini, sql.init 추가
└── data-local.sql                                 # NEW: 로컬 개발용 초기 데이터

src/test/java/org/herotalk/
├── auth/AuthControllerTest.java                   # NEW
├── character/CharacterControllerTest.java         # NEW
├── battle/BattleServiceTest.java                  # NEW
└── ai/GeminiClientTest.java                       # NEW
```

### 프론트엔드 신규/수정

```
frontend/src/
├── api/
│   ├── auth.js          # NEW: API 함수 분리
│   ├── character.js     # NEW
│   └── battle.js        # NEW
├── store/
│   ├── characterStore.js  # NEW
│   └── battleStore.js     # NEW
├── pages/
│   ├── character/
│   │   ├── CharacterCreatePage.jsx  # NEW
│   │   └── CharacterCreatePage.css  # NEW
│   └── game/
│       ├── BattlePage.jsx           # NEW
│       └── BattlePage.css           # NEW
├── components/ui/
│   ├── HpBar.jsx        # NEW
│   ├── MicButton.jsx    # NEW
│   └── ScorePopup.jsx   # NEW
├── game/scenes/
│   └── FieldScene.js    # NEW: Phaser WASD 이동
└── App.jsx              # MODIFY: 라우트 추가
```

---

## Task 1: Auth/Character 통합 테스트 + SecurityUtil

**Files:**
- Create: `src/test/java/org/herotalk/auth/AuthControllerTest.java`
- Create: `src/test/java/org/herotalk/character/CharacterControllerTest.java`
- Create: `src/main/java/org/herotalk/security/util/SecurityUtil.java`

- [ ] **Step 1: SecurityUtil 작성**

```java
// src/main/java/org/herotalk/security/util/SecurityUtil.java
package org.herotalk.security.util;

import org.herotalk.security.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtil {
    public Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof CustomUserDetails)) {
            throw new IllegalStateException("인증 정보가 없습니다.");
        }
        return ((CustomUserDetails) auth.getPrincipal()).getUserId();
    }
}
```

- [ ] **Step 2: AuthControllerTest 작성**

```java
// src/test/java/org/herotalk/auth/AuthControllerTest.java
package org.herotalk.auth;

import org.herotalk.domain.auth.dto.LoginRequest;
import org.herotalk.domain.auth.dto.SignupRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

@SpringBootTest(webEnvironment = RANDOM_PORT)
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired TestRestTemplate restTemplate;

    @Test
    void 회원가입_성공() {
        var req = new SignupRequest("signup1@test.com", "password123", "테스터");
        var res = restTemplate.postForEntity("/api/auth/signup", req, Map.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(((Map<?,?>) res.getBody().get("data")).get("accessToken")).isNotNull();
    }

    @Test
    void 이메일_중복_회원가입_실패() {
        var req = new SignupRequest("dup@test.com", "password123", "중복유저");
        restTemplate.postForEntity("/api/auth/signup", req, Map.class);
        var res = restTemplate.postForEntity("/api/auth/signup", req, Map.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void 로그인_성공() {
        restTemplate.postForEntity("/api/auth/signup",
            new SignupRequest("login1@test.com", "password123", "로그인유저"), Map.class);
        var res = restTemplate.postForEntity("/api/auth/login",
            new LoginRequest("login1@test.com", "password123"), Map.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void 잘못된_비밀번호_로그인_실패() {
        restTemplate.postForEntity("/api/auth/signup",
            new SignupRequest("wrong1@test.com", "password123", "유저"), Map.class);
        var res = restTemplate.postForEntity("/api/auth/login",
            new LoginRequest("wrong1@test.com", "WRONG_PW"), Map.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
```

- [ ] **Step 3: CharacterControllerTest 작성**

```java
// src/test/java/org/herotalk/character/CharacterControllerTest.java
package org.herotalk.character;

import org.herotalk.domain.auth.dto.SignupRequest;
import org.herotalk.domain.character.dto.CharacterCreateRequest;
import org.herotalk.domain.character.entity.Character;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

@SpringBootTest(webEnvironment = RANDOM_PORT)
@ActiveProfiles("test")
class CharacterControllerTest {

    @Autowired TestRestTemplate restTemplate;

    private String signupAndGetToken(String email) {
        var res = restTemplate.postForEntity("/api/auth/signup",
            new SignupRequest(email, "pass1234!", "용사"), Map.class);
        return (String) ((Map<?,?>) res.getBody().get("data")).get("accessToken");
    }

    @Test
    void 캐릭터_생성_성공() {
        String token = signupAndGetToken("char1@test.com");
        var headers = new HttpHeaders();
        headers.setBearerAuth(token);
        var req = new CharacterCreateRequest("용사김철수", Character.Job.WARRIOR);
        var res = restTemplate.exchange("/api/characters", HttpMethod.POST,
            new HttpEntity<>(req, headers), Map.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(((Map<?,?>) res.getBody().get("data")).get("name")).isEqualTo("용사김철수");
    }

    @Test
    void 인증없이_캐릭터_조회_실패() {
        var res = restTemplate.getForEntity("/api/characters/me", Map.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**
```bash
./gradlew test 2>&1 | grep -E "PASS|FAIL|ERROR|Tests run"
```
예상: 모든 테스트 PASS

- [ ] **Step 5: 커밋**
```bash
git add src/test/java/org/herotalk/auth/ src/test/java/org/herotalk/character/ \
        src/main/java/org/herotalk/security/util/
git commit -m "test: Auth/Character 통합 테스트 + SecurityUtil 추가"
```

---

## Task 2: QuestionService + Repository + 초기 데이터

**Files:**
- Create: `src/main/java/org/herotalk/domain/question/repository/QuestionRepository.java`
- Create: `src/main/java/org/herotalk/domain/question/repository/QuestionHistoryRepository.java`
- Create: `src/main/java/org/herotalk/domain/question/service/QuestionService.java`
- Create: `src/main/resources/data-local.sql`
- Modify: `src/main/resources/application-local.yml`

- [ ] **Step 1: QuestionRepository 작성**

```java
// src/main/java/org/herotalk/domain/question/repository/QuestionRepository.java
package org.herotalk.domain.question.repository;

import org.herotalk.domain.question.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByToeicPartAndIsActiveTrue(Question.ToeicPart toeicPart);
}
```

- [ ] **Step 2: QuestionHistoryRepository 작성**

```java
// src/main/java/org/herotalk/domain/question/repository/QuestionHistoryRepository.java
package org.herotalk.domain.question.repository;

import org.herotalk.domain.question.entity.QuestionHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuestionHistoryRepository extends JpaRepository<QuestionHistory, Long> {
    List<QuestionHistory> findTop10ByCharacterIdOrderByLastShownAtDesc(Long characterId);
    Optional<QuestionHistory> findByCharacterIdAndQuestionId(Long characterId, Long questionId);
}
```

- [ ] **Step 3: QuestionService 작성**

```java
// src/main/java/org/herotalk/domain/question/service/QuestionService.java
package org.herotalk.domain.question.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.character.repository.CharacterRepository;
import org.herotalk.domain.question.entity.Question;
import org.herotalk.domain.question.entity.QuestionHistory;
import org.herotalk.domain.question.repository.QuestionHistoryRepository;
import org.herotalk.domain.question.repository.QuestionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuestionHistoryRepository questionHistoryRepository;
    private final CharacterRepository characterRepository;

    /**
     * 해당 파트에서 랜덤 문제 1개 출제 (최근 10문제 중복 제외)
     */
    @Transactional
    public Question getRandomQuestion(Long characterId, Question.ToeicPart part) {
        List<Question> all = questionRepository.findByToeicPartAndIsActiveTrue(part);
        if (all.isEmpty()) throw new IllegalStateException("해당 파트의 문제가 없습니다: " + part);

        // 최근 10개 출제 이력 제외
        List<Long> recentIds = questionHistoryRepository
            .findTop10ByCharacterIdOrderByLastShownAtDesc(characterId)
            .stream().map(h -> h.getQuestion().getId()).toList();

        List<Question> candidates = all.stream()
            .filter(q -> !recentIds.contains(q.getId()))
            .toList();

        // 후보가 없으면 전체에서 랜덤 (fallback)
        if (candidates.isEmpty()) candidates = all;

        Question selected = candidates.get(new Random().nextInt(candidates.size()));

        // 출제 이력 저장/업데이트
        questionHistoryRepository.findByCharacterIdAndQuestionId(characterId, selected.getId())
            .ifPresentOrElse(
                h -> h.setLastShownAt(LocalDateTime.now()),
                () -> {
                    var character = characterRepository.getReferenceById(characterId);
                    questionHistoryRepository.save(
                        QuestionHistory.builder()
                            .character(character)
                            .question(selected)
                            .lastShownAt(LocalDateTime.now())
                            .build()
                    );
                }
            );

        return selected;
    }
}
```

- [ ] **Step 4: QuestionHistory에 lastShownAt setter 추가 필요 여부 확인**

```bash
grep -n "lastShownAt\|@Setter" src/main/java/org/herotalk/domain/question/entity/QuestionHistory.java
```
`setLastShownAt` 메서드가 없으면 entity에 추가:
```java
public void setLastShownAt(LocalDateTime time) {
    this.lastShownAt = time;
}
```

- [ ] **Step 5: data-local.sql 작성**

```sql
-- src/main/resources/data-local.sql
-- 명시적 ID로 FK 참조 보장
INSERT INTO dungeons (id, name, description, toeic_part, required_level, region, is_weekly_boss, created_at, updated_at)
VALUES
  (1, '훈련소 숲',   'Part1 문장 읽기',   'PART1', 1,  '훈련소',      false, NOW(), NOW()),
  (2, '초보자 숲',   'Part2 사진 묘사',   'PART2', 3,  '초보자 숲',   false, NOW(), NOW()),
  (3, '고블린 던전', 'Part3 질문에 답하기','PART3', 8,  '고블린 던전', false, NOW(), NOW());

INSERT INTO monsters (id, dungeon_id, name, monster_type, hp, attack_power, exp_reward, gold_reward, toeic_part, difficulty, created_at, updated_at)
VALUES
  (1, 2, '슬라임',    'NORMAL', 200,  10, 100, 20,  'PART2', 1, NOW(), NOW()),
  (2, 3, '고블린',    'NORMAL', 350,  20, 175, 30,  'PART3', 2, NOW(), NOW()),
  (3, 2, '고블린 킹', 'BOSS',  1000,  30, 500, 100, 'PART2', 3, NOW(), NOW());

-- PART1 문제
INSERT INTO questions (toeic_part, difficulty, question_text, prep_time, answer_time, sample_answer, hint, is_active, created_at, updated_at) VALUES
  ('PART1', 1, 'Read aloud: The company has recently expanded its operations to three new countries.', 45, 45, 'The company has recently expanded its operations to three new countries.', '천천히 또박또박 읽으세요', true, NOW(), NOW()),
  ('PART1', 1, 'Read aloud: Please submit your report by the end of this week.', 45, 45, 'Please submit your report by the end of this week.', '강세: SUBmit, rePORT', true, NOW(), NOW());

-- PART2 문제
INSERT INTO questions (toeic_part, difficulty, question_text, prep_time, answer_time, sample_answer, hint, is_active, created_at, updated_at) VALUES
  ('PART2', 1, 'Describe the picture. What do you see?', 45, 45,
   'In this picture, I can see a woman sitting at a desk. She appears to be working on a computer. There are some papers and a coffee cup on the desk.',
   '위치 → 사람 → 행동 순서로 묘사', true, NOW(), NOW()),
  ('PART2', 2, 'Describe what is happening in the image.', 45, 45,
   'The image shows a busy office environment. Several people are working at their desks.',
   'There is/are 구문으로 시작', true, NOW(), NOW());

-- PART3 문제
INSERT INTO questions (toeic_part, difficulty, question_text, prep_time, answer_time, sample_answer, hint, is_active, created_at, updated_at) VALUES
  ('PART3', 2, 'What do you usually do on weekends?', 3, 15,
   'On weekends, I usually spend time with my family. We often go to the park or watch movies together.',
   'I usually... / I often...', true, NOW(), NOW()),
  ('PART3', 2, 'What is your favorite way to relax after work?', 3, 15,
   'My favorite way to relax is listening to music. It helps me unwind and forget about the stress.',
   'My favorite... is ...ing', true, NOW(), NOW()),
  ('PART3', 3, 'Do you prefer working from home or at the office? Why?', 3, 30,
   'I prefer working from home because it gives me more flexibility and I can avoid the long commute. However, I miss interacting with my colleagues.',
   '이유를 2가지 이상 말하세요', true, NOW(), NOW());
```

- [ ] **Step 6: application-local.yml에 SQL init + Gemini 설정 추가**

```yaml
# application-local.yml 하단에 추가
spring:
  sql:
    init:
      mode: always
      data-locations: classpath:data-local.sql

gemini:
  api-key: ${GEMINI_API_KEY:your-gemini-api-key-here}
  api-url: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent

app:
  frontend-url: http://localhost:3000
```

- [ ] **Step 7: 컴파일 확인**
```bash
./gradlew compileJava 2>&1 | tail -3
```

- [ ] **Step 8: 커밋**
```bash
git add src/main/java/org/herotalk/domain/question/ src/main/resources/
git commit -m "feat: QuestionService (랜덤 출제, 중복 방지) + 로컬 초기 데이터 SQL"
```

---

## Task 3: Gemini Flash API 채점 서비스

**Files:**
- Create: `src/main/java/org/herotalk/domain/ai/dto/ScoreRequest.java`
- Create: `src/main/java/org/herotalk/domain/ai/dto/ScoreResponse.java`
- Create: `src/main/java/org/herotalk/domain/ai/GeminiClient.java`
- Create: `src/test/java/org/herotalk/ai/GeminiClientTest.java`
- Modify: `src/main/resources/application.yml`

- [ ] **Step 1: ScoreRequest DTO**

```java
// src/main/java/org/herotalk/domain/ai/dto/ScoreRequest.java
package org.herotalk.domain.ai.dto;

import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class ScoreRequest {
    private String toeicPart;    // "PART2", "PART3" 등
    private String questionText; // 문제 텍스트
    private String answerText;   // 유저 STT 변환 텍스트
}
```

- [ ] **Step 2: ScoreResponse DTO**

```java
// src/main/java/org/herotalk/domain/ai/dto/ScoreResponse.java
package org.herotalk.domain.ai.dto;

import lombok.*;

@Getter @Builder @NoArgsConstructor @AllArgsConstructor
public class ScoreResponse {
    private int    score;        // 0~100
    private String feedbackGood; // 잘한 점 (한국어)
    private String feedbackBad;  // 개선점 (한국어)
    private String sampleAnswer; // 모범 답안 (영어)
}
```

- [ ] **Step 3: GeminiClient 작성**

```java
// src/main/java/org/herotalk/domain/ai/GeminiClient.java
package org.herotalk.domain.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.herotalk.domain.ai.dto.ScoreRequest;
import org.herotalk.domain.ai.dto.ScoreResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class GeminiClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.api-url}")
    private String apiUrl;

    public GeminiClient(RestClient.Builder builder, ObjectMapper objectMapper) {
        this.restClient   = builder.build();
        this.objectMapper = objectMapper;
    }

    public ScoreResponse score(ScoreRequest request) {
        String prompt = buildPrompt(request);
        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
        );
        try {
            String raw = restClient.post()
                .uri(apiUrl + "?key=" + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);
            return parseResponse(raw);
        } catch (Exception e) {
            log.error("Gemini API 호출 실패: {}", e.getMessage());
            return ScoreResponse.builder()
                .score(50)
                .feedbackGood("채점 서버와 연결할 수 없었습니다.")
                .feedbackBad("네트워크 상태를 확인해주세요.")
                .sampleAnswer("")
                .build();
        }
    }

    private String buildPrompt(ScoreRequest req) {
        return """
            You are a TOEIC Speaking examiner. Score the following answer strictly.

            Question Type: %s
            Question: %s
            Student's Answer: %s

            Evaluate based on TOEIC Speaking criteria:
            - Pronunciation & Intonation: 25 points
            - Grammar: 25 points
            - Vocabulary: 25 points
            - Content Completeness: 25 points

            Respond ONLY with valid JSON (no markdown):
            {"score":<0-100>,"feedback_good":"<Korean>","feedback_bad":"<Korean>","sample_answer":"<English>"}
            """.formatted(req.getToeicPart(), req.getQuestionText(), req.getAnswerText());
    }

    private ScoreResponse parseResponse(String raw) throws Exception {
        JsonNode root = objectMapper.readTree(raw);
        String text = root.path("candidates").get(0)
            .path("content").path("parts").get(0)
            .path("text").asText();
        // ```json ... ``` 블록 제거
        text = text.replaceAll("(?s)```json\\s*", "").replaceAll("```", "").trim();
        JsonNode r = objectMapper.readTree(text);
        return ScoreResponse.builder()
            .score(r.path("score").asInt())
            .feedbackGood(r.path("feedback_good").asText())
            .feedbackBad(r.path("feedback_bad").asText())
            .sampleAnswer(r.path("sample_answer").asText())
            .build();
    }
}
```

- [ ] **Step 4: application.yml에 Gemini 설정 추가**

```yaml
gemini:
  api-key: ${GEMINI_API_KEY}
  api-url: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent

app:
  frontend-url: ${FRONTEND_URL:http://localhost:3000}
```

- [ ] **Step 5: GeminiClient 프롬프트 단위 테스트**

```java
// src/test/java/org/herotalk/ai/GeminiClientTest.java
package org.herotalk.ai;

import org.herotalk.domain.ai.GeminiClient;
import org.herotalk.domain.ai.dto.ScoreRequest;
import org.herotalk.domain.ai.dto.ScoreResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class GeminiClientTest {

    @Autowired GeminiClient geminiClient;

    @Test
    void API_키_없을때_fallback_점수_반환() {
        // test profile에서 api-key가 placeholder면 API 호출 실패 → fallback 50점 반환
        ScoreRequest req = ScoreRequest.builder()
            .toeicPart("PART2")
            .questionText("Describe the picture.")
            .answerText("I can see a woman sitting at a desk.")
            .build();
        ScoreResponse res = geminiClient.score(req);
        assertThat(res.getScore()).isBetween(0, 100);
        assertThat(res.getFeedbackGood()).isNotNull();
    }
}
```

- [ ] **Step 6: 테스트 실행**
```bash
./gradlew test --tests "org.herotalk.ai.GeminiClientTest" 2>&1 | tail -10
```

- [ ] **Step 7: 커밋**
```bash
git add src/main/java/org/herotalk/domain/ai/ src/test/java/org/herotalk/ai/ src/main/resources/application.yml
git commit -m "feat: GeminiClient - Gemini Flash API 채점 서비스 (fallback 포함)"
```

---

## Task 4: 배틀 시스템 백엔드

**Files:**
- Create: `src/main/java/org/herotalk/domain/dungeon/repository/MonsterRepository.java`
- Create: `src/main/java/org/herotalk/domain/battle/repository/BattleRepository.java`
- Create: `src/main/java/org/herotalk/domain/battle/repository/BattleTurnRepository.java`
- Create: `src/main/java/org/herotalk/domain/battle/dto/*.java` (4개)
- Create: `src/main/java/org/herotalk/domain/battle/service/BattleService.java`
- Create: `src/main/java/org/herotalk/domain/battle/controller/BattleController.java`
- Create: `src/test/java/org/herotalk/battle/BattleServiceTest.java`

- [ ] **Step 1: Repository 3개 작성**

```java
// MonsterRepository.java (패키지: domain.dungeon.repository — Monster가 dungeon 패키지)
package org.herotalk.domain.dungeon.repository;
import org.herotalk.domain.dungeon.entity.Monster;
import org.springframework.data.jpa.repository.JpaRepository;
public interface MonsterRepository extends JpaRepository<Monster, Long> {}

// BattleRepository.java
package org.herotalk.domain.battle.repository;
import org.herotalk.domain.battle.entity.Battle;
import org.herotalk.domain.character.entity.Character;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface BattleRepository extends JpaRepository<Battle, Long> {
    // 진행 중(result == null)인 배틀 조회 — 연관 객체로 조회
    Optional<Battle> findByCharacterAndResultIsNull(Character character);
}

// BattleTurnRepository.java
package org.herotalk.domain.battle.repository;
import org.herotalk.domain.battle.entity.BattleTurn;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface BattleTurnRepository extends JpaRepository<BattleTurn, Long> {
    List<BattleTurn> findByBattleIdOrderByTurnNumberAsc(Long battleId);
    long countByBattleId(Long battleId);
}
```

- [ ] **Step 2: DTO 4개 작성**

```java
// BattleStartRequest.java
package org.herotalk.domain.battle.dto;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
public class BattleStartRequest { @NotNull @Getter private Long monsterId; }

// BattleStartResponse.java
package org.herotalk.domain.battle.dto;
import lombok.Builder; import lombok.Getter;
@Getter @Builder
public class BattleStartResponse {
    private Long   battleId;
    private String monsterName;
    private int    monsterHp;
    private int    monsterAttackPower;
    private String questionText;
    private Long   questionId;
    private String toeicPart;
    private int    prepTime;
    private int    answerTime;
    private String hint;
    private String characterName;
    private int    characterHp;
    private int    characterMaxHp;
}

// BattleTurnRequest.java
package org.herotalk.domain.battle.dto;
import jakarta.validation.constraints.NotBlank; import jakarta.validation.constraints.NotNull;
import lombok.Getter;
public class BattleTurnRequest {
    @NotNull  @Getter private Long   battleId;
    @NotBlank @Getter private String action;      // ATTACK | HINT | PASS | FLEE
    @Getter          private String answerText;   // ATTACK 시 STT 텍스트
    @Getter          private Long   questionId;   // 현재 문제 ID (서버에서 채점용)
}

// BattleTurnResponse.java
package org.herotalk.domain.battle.dto;
import lombok.Builder; import lombok.Getter;
@Getter @Builder
public class BattleTurnResponse {
    private int     score;
    private int     damageDealt;
    private int     damageTaken;
    private boolean isCritical;
    private int     monsterHpRemaining;
    private int     characterHpRemaining;
    private boolean isBattleOver;
    private String  battleResult;      // WIN | LOSE | FLEE | null
    private int     expGained;
    private int     goldGained;
    private String  feedbackGood;
    private String  feedbackBad;
    private String  sampleAnswer;
    // 다음 턴 문제
    private Long    nextQuestionId;
    private String  nextQuestionText;
    private int     nextPrepTime;
    private int     nextAnswerTime;
    private String  nextHint;
    private String  nextToeicPart;
}
```

- [ ] **Step 3: BattleService 작성**

```java
// src/main/java/org/herotalk/domain/battle/service/BattleService.java
package org.herotalk.domain.battle.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.ai.GeminiClient;
import org.herotalk.domain.ai.dto.ScoreRequest;
import org.herotalk.domain.ai.dto.ScoreResponse;
import org.herotalk.domain.battle.dto.*;
import org.herotalk.domain.battle.entity.Battle;
import org.herotalk.domain.battle.entity.BattleTurn;
import org.herotalk.domain.battle.repository.BattleRepository;
import org.herotalk.domain.battle.repository.BattleTurnRepository;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.domain.character.entity.CharacterStats;
import org.herotalk.domain.character.repository.CharacterRepository;
import org.herotalk.domain.character.repository.CharacterStatsRepository;
import org.herotalk.domain.dungeon.entity.Monster;
import org.herotalk.domain.dungeon.repository.MonsterRepository;
import org.herotalk.domain.question.entity.Question;
import org.herotalk.domain.question.repository.QuestionRepository;
import org.herotalk.domain.question.service.QuestionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class BattleService {

    private final BattleRepository         battleRepository;
    private final BattleTurnRepository     battleTurnRepository;
    private final CharacterRepository      characterRepository;
    private final CharacterStatsRepository characterStatsRepository;
    private final MonsterRepository        monsterRepository;
    private final QuestionRepository       questionRepository;
    private final QuestionService          questionService;
    private final GeminiClient             geminiClient;

    /** 배틀 시작 */
    public BattleStartResponse startBattle(Long userId, BattleStartRequest req) {
        Character character = characterRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalStateException("캐릭터가 없습니다."));

        // 이미 진행 중인 배틀 있으면 도망 처리
        battleRepository.findByCharacterAndResultIsNull(character)
            .ifPresent(Battle::flee);

        Monster monster = monsterRepository.findById(req.getMonsterId())
            .orElseThrow(() -> new IllegalArgumentException("몬스터를 찾을 수 없습니다."));

        Battle battle = Battle.builder()
            .character(character)
            .monster(monster)
            .startedAt(LocalDateTime.now())
            .build();
        battle.initMonsterHp(monster.getHp());
        battleRepository.save(battle);

        Question question = questionService.getRandomQuestion(character.getId(), monster.getToeicPart());

        return BattleStartResponse.builder()
            .battleId(battle.getId())
            .monsterName(monster.getName())
            .monsterHp(monster.getHp())
            .monsterAttackPower(monster.getAttackPower())
            .questionId(question.getId())
            .questionText(question.getQuestionText())
            .toeicPart(question.getToeicPart().name())
            .prepTime(question.getPrepTime())
            .answerTime(question.getAnswerTime())
            .hint(question.getHint())
            .characterName(character.getName())
            .characterHp(character.getHp())
            .characterMaxHp(character.getMaxHp())
            .build();
    }

    /** 턴 처리 */
    public BattleTurnResponse processTurn(Long userId, BattleTurnRequest req) {
        Battle battle = battleRepository.findById(req.getBattleId())
            .orElseThrow(() -> new IllegalArgumentException("배틀을 찾을 수 없습니다."));

        Character character = battle.getCharacter();
        Monster monster = battle.getMonster();
        CharacterStats stats = characterStatsRepository.findByCharacterId(character.getId())
            .orElseThrow(() -> new IllegalStateException("캐릭터 스탯이 없습니다."));

        BattleTurn.TurnAction action = BattleTurn.TurnAction.valueOf(req.getAction());

        // 도망
        if (action == BattleTurn.TurnAction.FLEE) {
            battle.flee();
            return BattleTurnResponse.builder()
                .isBattleOver(true).battleResult("FLEE")
                .damageDealt(0).damageTaken(0)
                .monsterHpRemaining(battle.getCurrentMonsterHp())
                .characterHpRemaining(character.getHp())
                .build();
        }

        // 채점
        int score = 0;
        String feedbackGood = "", feedbackBad = "", sampleAnswer = "";

        if (action == BattleTurn.TurnAction.ATTACK && req.getAnswerText() != null && req.getQuestionId() != null) {
            Question question = questionRepository.findById(req.getQuestionId())
                .orElseThrow(() -> new IllegalArgumentException("문제를 찾을 수 없습니다."));
            ScoreResponse scoreRes = geminiClient.score(ScoreRequest.builder()
                .toeicPart(monster.getToeicPart().name())
                .questionText(question.getQuestionText())
                .answerText(req.getAnswerText())
                .build());
            score = scoreRes.getScore();
            feedbackGood = scoreRes.getFeedbackGood();
            feedbackBad  = scoreRes.getFeedbackBad();
            sampleAnswer = scoreRes.getSampleAnswer();
        } else if (action == BattleTurn.TurnAction.HINT) {
            score = 0; // HINT: 패널티로 데미지 -20% 처리는 calculateDamage에서
        }

        // 데미지 계산
        int damageDealt  = calculateDamage(score, stats, action);
        boolean isCritical = (score == 100 && action == BattleTurn.TurnAction.ATTACK);

        // 몬스터 반격 데미지 (PASS면 1.5배, 0~19점이면 2배)
        int monsterBase  = Math.max(5, monster.getAttackPower() - stats.getGrammar() * 2);
        int damageTaken  = (action == BattleTurn.TurnAction.PASS) ? (int)(monsterBase * 1.5)
                         : (score <= 19 && action == BattleTurn.TurnAction.ATTACK) ? monsterBase * 2
                         : monsterBase;

        // HP 반영 (도메인 메서드 사용 → JPA dirty-checking으로 자동 저장)
        int monsterHpLeft    = battle.damageMonster(damageDealt);
        int characterHpLeft  = character.applyDamage(damageTaken);

        // 턴 기록 저장
        int turnNumber = (int) battleTurnRepository.countByBattleId(battle.getId()) + 1;
        battleTurnRepository.save(BattleTurn.builder()
            .battle(battle)
            .question(req.getQuestionId() != null ? questionRepository.getReferenceById(req.getQuestionId()) : null)
            .turnNumber(turnNumber)
            .action(action)
            .answerText(req.getAnswerText())
            .score(score)
            .feedbackGood(feedbackGood)
            .feedbackBad(feedbackBad)
            .sampleAnswer(sampleAnswer)
            .damageDealt(damageDealt)
            .damageTaken(damageTaken)
            .isCritical(isCritical)
            .isReviewed(score > 0 && score <= 40)
            .createdAt(LocalDateTime.now())
            .build());

        // 배틀 종료 판정
        boolean isOver = monsterHpLeft <= 0 || characterHpLeft <= 0;
        Battle.BattleResult result = null;
        int expGained = 0, goldGained = 0;

        if (isOver) {
            result    = monsterHpLeft <= 0 ? Battle.BattleResult.WIN : Battle.BattleResult.LOSE;
            expGained = result == Battle.BattleResult.WIN
                ? (int)(monster.getHp() * (monster.getMonsterType() == Monster.MonsterType.BOSS ? 1.0 : 0.5))
                : 50;
            goldGained = result == Battle.BattleResult.WIN ? monster.getGoldReward() : 0;

            character.addExp(expGained);
            character.addGold(goldGained);
            if (result == Battle.BattleResult.LOSE) character.restoreHp();

            battle.finish(result, turnNumber, expGained, goldGained);
        }

        // 다음 문제 (배틀 계속 시)
        BattleTurnResponse.BattleTurnResponseBuilder builder = BattleTurnResponse.builder()
            .score(score).damageDealt(damageDealt).damageTaken(damageTaken)
            .isCritical(isCritical)
            .monsterHpRemaining(monsterHpLeft).characterHpRemaining(characterHpLeft)
            .isBattleOver(isOver)
            .battleResult(result != null ? result.name() : null)
            .expGained(expGained).goldGained(goldGained)
            .feedbackGood(feedbackGood).feedbackBad(feedbackBad).sampleAnswer(sampleAnswer);

        if (!isOver) {
            Question next = questionService.getRandomQuestion(character.getId(), monster.getToeicPart());
            builder.nextQuestionId(next.getId())
                   .nextQuestionText(next.getQuestionText())
                   .nextPrepTime(next.getPrepTime())
                   .nextAnswerTime(next.getAnswerTime())
                   .nextHint(next.getHint())
                   .nextToeicPart(next.getToeicPart().name());
        }

        return builder.build();
    }

    /** 데미지 계산 공식 */
    private int calculateDamage(int score, CharacterStats stats, BattleTurn.TurnAction action) {
        if (action == BattleTurn.TurnAction.PASS) return 0;

        int effectiveScore = action == BattleTurn.TurnAction.HINT
            ? Math.max(0, score - 20) : score;

        double multiplier = switch (effectiveScore / 20) {
            case 5 -> 1.5;  // 100점 크리티컬
            case 4 -> 1.0;  // 80~99
            case 3 -> 0.7;  // 60~79
            case 2 -> 0.4;  // 40~59
            case 1 -> 0.1;  // 20~39 미스
            default -> 0.0; // 0~19 실패
        };

        int base = 20 + stats.getFluency() * 2;
        return (int)(base * multiplier);
    }
}
```

- [ ] **Step 4: BattleController 작성**

```java
// src/main/java/org/herotalk/domain/battle/controller/BattleController.java
package org.herotalk.domain.battle.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.herotalk.domain.battle.dto.*;
import org.herotalk.domain.battle.service.BattleService;
import org.herotalk.global.response.ApiResponse;
import org.herotalk.security.util.SecurityUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/battles")
@RequiredArgsConstructor
public class BattleController {

    private final BattleService battleService;
    private final SecurityUtil  securityUtil;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<BattleStartResponse>> start(
            @Valid @RequestBody BattleStartRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
            battleService.startBattle(securityUtil.getCurrentUserId(), request)));
    }

    @PostMapping("/turn")
    public ResponseEntity<ApiResponse<BattleTurnResponse>> turn(
            @Valid @RequestBody BattleTurnRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
            battleService.processTurn(securityUtil.getCurrentUserId(), request)));
    }
}
```

- [ ] **Step 5: BattleTurn 엔티티에 createdAt 필드 확인**
```bash
grep -n "createdAt" src/main/java/org/herotalk/domain/battle/entity/BattleTurn.java
```
없으면 builder 호출에서 `.createdAt(...)` 제거

- [ ] **Step 6: 컴파일 확인**
```bash
./gradlew compileJava 2>&1 | tail -5
```

- [ ] **Step 7: 커밋**
```bash
git add src/main/java/org/herotalk/domain/battle/ src/main/java/org/herotalk/domain/dungeon/repository/
git commit -m "feat: 배틀 시스템 백엔드 (시작/턴/종료, 데미지 계산, 경험치/골드 지급)"
```

---

## Task 5: 프론트엔드 API 레이어 + 스토어

**Files:**
- Create: `frontend/src/api/auth.js`
- Create: `frontend/src/api/character.js`
- Create: `frontend/src/api/battle.js`
- Create: `frontend/src/store/characterStore.js`
- Create: `frontend/src/store/battleStore.js`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: API 함수 파일 3개 작성**

```js
// frontend/src/api/auth.js
import api from './axios'
export const signup  = (data) => api.post('/auth/signup', data)
export const login   = (data) => api.post('/auth/login', data)
export const refresh = (data) => api.post('/auth/refresh', data)

// frontend/src/api/character.js
import api from './axios'
export const createCharacter = (data) => api.post('/characters', data)
export const getMyCharacter  = ()     => api.get('/characters/me')

// frontend/src/api/battle.js
import api from './axios'
export const startBattle = (monsterId) => api.post('/battles/start', { monsterId })
export const sendTurn    = (data)      => api.post('/battles/turn', data)
```

- [ ] **Step 2: characterStore 작성**

```js
// frontend/src/store/characterStore.js
import { create } from 'zustand'
import { getMyCharacter } from '@/api/character'

const useCharacterStore = create((set) => ({
  character: null,
  loading: false,

  fetchCharacter: async () => {
    set({ loading: true })
    try {
      const { data } = await getMyCharacter()
      set({ character: data.data })
    } catch {
      set({ character: null })
    } finally {
      set({ loading: false })
    }
  },

  setCharacter: (character) => set({ character }),
  clearCharacter: ()        => set({ character: null }),
}))

export default useCharacterStore
```

- [ ] **Step 3: battleStore 작성**

```js
// frontend/src/store/battleStore.js
import { create } from 'zustand'

const useBattleStore = create((set) => ({
  battleId:        null,
  monster:         null,
  character:       null,
  currentQuestion: null,
  monsterHp:       0,
  characterHp:     0,
  isOver:          false,
  result:          null,
  lastTurnResult:  null,

  initBattle: (res) => set({
    battleId:        res.battleId,
    monster:         { name: res.monsterName, hp: res.monsterHp, attackPower: res.monsterAttackPower },
    character:       { name: res.characterName, hp: res.characterHp, maxHp: res.characterMaxHp },
    currentQuestion: {
      id: res.questionId, text: res.questionText,
      toeicPart: res.toeicPart, prepTime: res.prepTime,
      answerTime: res.answerTime, hint: res.hint,
    },
    monsterHp:  res.monsterHp,
    characterHp: res.characterHp,
    isOver: false,
    result: null,
    lastTurnResult: null,
  }),

  applyTurnResult: (res) => set((state) => ({
    monsterHp:   res.monsterHpRemaining,
    characterHp: res.characterHpRemaining,
    currentQuestion: res.isBattleOver ? state.currentQuestion : {
      id: res.nextQuestionId, text: res.nextQuestionText,
      toeicPart: res.nextToeicPart, prepTime: res.nextPrepTime,
      answerTime: res.nextAnswerTime, hint: res.nextHint,
    },
    isOver:         res.isBattleOver,
    result:         res.battleResult,
    lastTurnResult: res,
  })),

  resetBattle: () => set({
    battleId: null, monster: null, character: null,
    currentQuestion: null, monsterHp: 0, characterHp: 0,
    isOver: false, result: null, lastTurnResult: null,
  }),
}))

export default useBattleStore
```

- [ ] **Step 4: App.jsx 라우팅 추가**

```jsx
// App.jsx imports 추가
import CharacterCreatePage from '@/pages/character/CharacterCreatePage'
import BattlePage from '@/pages/game/BattlePage'

// Routes 내부에 추가
<Route path="/character/create" element={<PrivateRoute><CharacterCreatePage /></PrivateRoute>} />
<Route path="/battle" element={<PrivateRoute><BattlePage /></PrivateRoute>} />
```

- [ ] **Step 5: 빌드 확인**
```bash
cd frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 6: 커밋**
```bash
git add frontend/src/api/ frontend/src/store/ frontend/src/App.jsx
git commit -m "feat: 프론트 API 레이어 분리 + characterStore + battleStore + 라우팅"
```

---

## Task 6: 캐릭터 생성 페이지

**Files:**
- Create: `frontend/src/pages/character/CharacterCreatePage.jsx`
- Create: `frontend/src/pages/character/CharacterCreatePage.css`

- [ ] **Step 1: CharacterCreatePage.css 작성**

```css
/* frontend/src/pages/character/CharacterCreatePage.css */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Noto+Sans+KR:wght@400;700&display=swap');

.cc-root {
  width: 100vw; height: 100vh; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at 50% 30%, rgba(88,28,135,0.3), transparent 60%),
              radial-gradient(ellipse at 80% 80%, rgba(30,27,75,0.4), transparent 60%),
              #050310;
  font-family: 'Noto Sans KR', sans-serif;
}
.cc-card {
  width: 860px;
  background: rgba(12,8,30,0.97);
  border: 1px solid rgba(147,51,234,0.3);
  border-radius: 20px;
  padding: 48px;
  box-shadow: 0 0 60px rgba(147,51,234,0.15), 0 32px 80px rgba(0,0,0,0.7);
}
.cc-title {
  font-family: 'Cinzel', serif;
  font-size: 28px; font-weight: 900;
  background: linear-gradient(135deg, #facc15, #f59e0b);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  text-align: center; margin-bottom: 8px;
}
.cc-subtitle { text-align: center; color: rgba(196,181,253,0.5); font-size: 13px; margin-bottom: 36px; }
.cc-classes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 32px; }
.cc-class-card {
  padding: 20px 16px; border-radius: 14px;
  border: 2px solid rgba(147,51,234,0.15);
  background: rgba(255,255,255,0.02);
  cursor: pointer; transition: all 0.25s ease; text-align: center;
}
.cc-class-card:hover { border-color: rgba(167,139,250,0.4); background: rgba(147,51,234,0.06); transform: translateY(-3px); }
.cc-class-card.selected {
  border-color: rgba(250,204,21,0.7);
  background: rgba(250,204,21,0.06);
  box-shadow: 0 0 20px rgba(250,204,21,0.15), inset 0 0 20px rgba(250,204,21,0.03);
  transform: translateY(-4px);
}
.cc-class-icon  { font-size: 40px; margin-bottom: 10px; display: block; }
.cc-class-name  { font-weight: 700; color: #fff; font-size: 15px; margin-bottom: 4px; }
.cc-class-desc  { font-size: 11px; color: rgba(196,181,253,0.5); margin-bottom: 8px; }
.cc-class-stat  { font-size: 11px; color: rgba(250,204,21,0.7); font-weight: 700; letter-spacing: 1px; }
.cc-input-group { margin-bottom: 20px; }
.cc-label { display: block; font-size: 10px; letter-spacing: 3px; color: rgba(167,139,250,0.5);
            font-family: 'Cinzel',serif; margin-bottom: 8px; }
.cc-input {
  width: 100%; padding: 14px 16px; box-sizing: border-box;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(147,51,234,0.2);
  border-radius: 10px; color: #e2e8f0; font-size: 15px;
  font-family: 'Noto Sans KR', sans-serif; outline: none; transition: all 0.25s;
}
.cc-input:focus { border-color: rgba(167,139,250,0.5); box-shadow: 0 0 0 3px rgba(147,51,234,0.1); }
.cc-error { color: #f87171; font-size: 12px; margin-bottom: 12px; }
.cc-btn {
  width: 100%; padding: 16px; border: none; border-radius: 10px;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: #fff; font-size: 16px; font-weight: 700;
  font-family: 'Noto Sans KR', sans-serif; letter-spacing: 2px;
  cursor: pointer; transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(124,58,237,0.3);
}
.cc-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  box-shadow: 0 0 30px rgba(139,92,246,0.5); transform: translateY(-2px);
}
.cc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
```

- [ ] **Step 2: CharacterCreatePage.jsx 작성**

```jsx
// frontend/src/pages/character/CharacterCreatePage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCharacter } from '@/api/character'
import useCharacterStore from '@/store/characterStore'
import './CharacterCreatePage.css'

const CLASSES = [
  { key: 'WARRIOR', icon: '⚔️', name: '워리어', desc: '짧고 강한 답변', stat: 'FLUENCY ↑↑' },
  { key: 'MAGE',    icon: '🧙', name: '매지션', desc: '어휘 다양성',    stat: 'VOCABULARY ↑↑' },
  { key: 'KNIGHT',  icon: '🛡️', name: '나이트', desc: '문법 정확도',    stat: 'GRAMMAR ↑↑' },
  { key: 'RANGER',  icon: '🏹', name: '레인저', desc: '발음과 억양',    stat: 'DELIVERY ↑↑' },
]

export default function CharacterCreatePage() {
  const navigate = useNavigate()
  const setCharacter = useCharacterStore((s) => s.setCharacter)

  const [selectedJob, setSelectedJob] = useState(null)
  const [name,        setName]        = useState('')
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedJob) { setError('직업을 선택해주세요.'); return }
    if (name.trim().length < 2) { setError('이름은 2자 이상이어야 합니다.'); return }

    setLoading(true)
    setError('')
    try {
      const { data } = await createCharacter({ name: name.trim(), job: selectedJob })
      setCharacter(data.data)
      navigate('/game', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || '캐릭터 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cc-root">
      <div className="cc-card">
        <h1 className="cc-title">⚔️ 캐릭터 생성</h1>
        <p className="cc-subtitle">직업을 선택하고 모험가 이름을 정하세요</p>

        <div className="cc-classes">
          {CLASSES.map((c) => (
            <div
              key={c.key}
              className={`cc-class-card${selectedJob === c.key ? ' selected' : ''}`}
              onClick={() => { setSelectedJob(c.key); setError('') }}
            >
              <span className="cc-class-icon">{c.icon}</span>
              <div className="cc-class-name">{c.name}</div>
              <div className="cc-class-desc">{c.desc}</div>
              <div className="cc-class-stat">{c.stat}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cc-input-group">
            <label className="cc-label">ADVENTURER NAME</label>
            <input
              className="cc-input"
              type="text"
              placeholder="모험가 이름 (2~20자)"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              maxLength={20}
            />
          </div>
          {error && <p className="cc-error">⚠️ {error}</p>}
          <button className="cc-btn" type="submit" disabled={loading}>
            {loading ? '생성 중...' : '🌟  모험 시작하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 빌드 확인**
```bash
cd frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 4: 커밋**
```bash
git add frontend/src/pages/character/
git commit -m "feat: 캐릭터 생성 페이지 (직업 선택 카드 UI + API 연동)"
```

---

## Task 7: 배틀 페이지 + UI 컴포넌트

**Files:**
- Create: `frontend/src/components/ui/HpBar.jsx`
- Create: `frontend/src/components/ui/MicButton.jsx`
- Create: `frontend/src/components/ui/ScorePopup.jsx`
- Create: `frontend/src/pages/game/BattlePage.jsx`
- Create: `frontend/src/pages/game/BattlePage.css`

- [ ] **Step 1: HpBar 컴포넌트**

```jsx
// frontend/src/components/ui/HpBar.jsx
export default function HpBar({ current, max, label, reverse = false }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100))
  const color = pct > 50 ? '#22c55e' : pct > 20 ? '#eab308' : '#ef4444'
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
          <span>{label}</span><span>{current} / {max}</span>
        </div>
      )}
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6,
                    height: 10, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 6,
          background: color,
          transition: 'width 0.4s ease, background 0.4s ease',
          boxShadow: `0 0 8px ${color}`,
          float: reverse ? 'right' : 'left',
        }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: MicButton 컴포넌트**

```jsx
// frontend/src/components/ui/MicButton.jsx
import { useEffect } from 'react'
import useSpeechRecognition from '@/hooks/useSpeechRecognition'

export default function MicButton({ onResult, disabled }) {
  const { transcript, isListening, error, startListening, stopListening } = useSpeechRecognition()

  useEffect(() => {
    if (transcript && !isListening) onResult(transcript)
  }, [transcript, isListening])

  const pulse = {
    animation: isListening ? 'micPulse 1s ease-in-out infinite' : 'none',
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <style>{`@keyframes micPulse {
        0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)}
        50%{box-shadow:0 0 0 16px rgba(239,68,68,0)}
      }`}</style>
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        style={{
          width: 72, height: 72, borderRadius: '50%', border: 'none',
          background: isListening ? '#ef4444' : 'rgba(124,58,237,0.8)',
          color: '#fff', fontSize: 28, cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s', ...pulse,
        }}
      >
        {isListening ? '⏹' : '🎤'}
      </button>
      {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>{error}</p>}
      {transcript && !isListening && (
        <p style={{ color: 'rgba(196,181,253,0.8)', fontSize: 12, marginTop: 6, maxWidth: 300, margin: '6px auto 0' }}>
          "{transcript}"
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: ScorePopup 컴포넌트**

```jsx
// frontend/src/components/ui/ScorePopup.jsx
import { useEffect, useState } from 'react'

const getScoreLabel = (score) => {
  if (score === 100) return { text: '💥 CRITICAL!',  color: '#facc15' }
  if (score >= 80)  return { text: '⚔️ GREAT!',     color: '#22c55e' }
  if (score >= 60)  return { text: '✅ GOOD',        color: '#3b82f6' }
  if (score >= 40)  return { text: '⚠️ WEAK',        color: '#f97316' }
  if (score >= 20)  return { text: '💫 MISS',        color: '#94a3b8' }
  return                    { text: '❌ FAIL',        color: '#ef4444' }
}

export default function ScorePopup({ result, onClose }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setVisible(true) }, [])

  const label = getScoreLabel(result.score)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      opacity: visible ? 1 : 0, transition: 'opacity 0.3s',
    }}>
      <div style={{
        background: 'rgba(12,8,30,0.98)', border: `1px solid ${label.color}40`,
        borderRadius: 20, padding: '40px 48px', textAlign: 'center', maxWidth: 480,
        boxShadow: `0 0 40px ${label.color}30`,
        transform: visible ? 'scale(1)' : 'scale(0.8)', transition: 'transform 0.3s',
      }}>
        <div style={{ fontSize: 56, fontWeight: 900, color: label.color, marginBottom: 4 }}>
          {result.score}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: label.color, marginBottom: 20 }}>
          {label.text}
        </div>

        {result.feedbackGood && (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                        borderRadius: 10, padding: '10px 16px', marginBottom: 10, textAlign: 'left' }}>
            <span style={{ color: '#4ade80', fontSize: 12 }}>✅ 잘한 점</span>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: '4px 0 0' }}>{result.feedbackGood}</p>
          </div>
        )}
        {result.feedbackBad && (
          <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                        borderRadius: 10, padding: '10px 16px', marginBottom: 10, textAlign: 'left' }}>
            <span style={{ color: '#f87171', fontSize: 12 }}>💡 개선할 점</span>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: '4px 0 0' }}>{result.feedbackBad}</p>
          </div>
        )}
        {result.sampleAnswer && (
          <div style={{ background: 'rgba(147,51,234,0.08)', border: '1px solid rgba(147,51,234,0.2)',
                        borderRadius: 10, padding: '10px 16px', marginBottom: 20, textAlign: 'left' }}>
            <span style={{ color: '#a78bfa', fontSize: 12 }}>📖 모범 답안</span>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: '4px 0 0', fontStyle: 'italic' }}>{result.sampleAnswer}</p>
          </div>
        )}

        <button onClick={onClose} style={{
          padding: '12px 32px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
          border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          {result.isBattleOver ? '🏰 마을로 돌아가기' : '⚔️ 다음 턴'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: BattlePage.css 작성**

```css
/* frontend/src/pages/game/BattlePage.css */
.battle-root {
  width: 100vw; height: 100vh; overflow: hidden;
  background: radial-gradient(ellipse at 50% 0%, rgba(88,28,135,0.25), transparent 50%),
              linear-gradient(180deg, #0a0714 0%, #050310 100%);
  display: flex; flex-direction: column;
  font-family: 'Noto Sans KR', sans-serif;
  color: #fff;
}
.battle-top { padding: 20px 40px; display: flex; align-items: center; gap: 24px; border-bottom: 1px solid rgba(147,51,234,0.15); }
.monster-name { font-size: 18px; font-weight: 700; color: #f87171; min-width: 100px; }
.battle-main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px; gap: 24px; }
.question-box {
  width: 100%; max-width: 680px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(147,51,234,0.2);
  border-radius: 16px; padding: 24px 32px; text-align: center;
}
.question-part { font-size: 10px; letter-spacing: 3px; color: rgba(167,139,250,0.5); margin-bottom: 12px; }
.question-text { font-size: 17px; line-height: 1.7; color: rgba(255,255,255,0.9); }
.timer-row { display: flex; gap: 32px; align-items: center; justify-content: center; }
.timer-box { text-align: center; }
.timer-label { font-size: 10px; letter-spacing: 2px; color: rgba(148,163,184,0.4); margin-bottom: 4px; }
.timer-value { font-size: 36px; font-weight: 900; color: #facc15; font-variant-numeric: tabular-nums; }
.timer-value.danger { color: #ef4444; animation: timerDanger 0.5s ease-in-out infinite alternate; }
@keyframes timerDanger { from{opacity:1} to{opacity:0.5} }
.battle-actions { display: flex; gap: 12px; }
.action-btn {
  padding: 14px 24px; border: 1px solid rgba(147,51,234,0.25);
  border-radius: 12px; background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.8); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.25s; font-family: 'Noto Sans KR', sans-serif;
}
.action-btn:hover:not(:disabled) { border-color: rgba(167,139,250,0.5); background: rgba(147,51,234,0.1); transform: translateY(-2px); }
.action-btn.attack { background: rgba(124,58,237,0.2); border-color: rgba(124,58,237,0.5); color: #c4b5fd; }
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.battle-bottom { padding: 16px 40px; border-top: 1px solid rgba(147,51,234,0.15); display: flex; align-items: center; gap: 24px; }
.char-name { font-size: 14px; font-weight: 700; color: #a78bfa; min-width: 80px; }
```

- [ ] **Step 5: BattlePage.jsx 작성**

```jsx
// frontend/src/pages/game/BattlePage.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { startBattle, sendTurn } from '@/api/battle'
import useBattleStore from '@/store/battleStore'
import HpBar      from '@/components/ui/HpBar'
import MicButton  from '@/components/ui/MicButton'
import ScorePopup from '@/components/ui/ScorePopup'
import './BattlePage.css'

function useTimer(initialSeconds, onExpire, active) {
  const [seconds, setSeconds] = useState(initialSeconds)
  useEffect(() => {
    setSeconds(initialSeconds)
  }, [initialSeconds])
  useEffect(() => {
    if (!active || seconds <= 0) { if (seconds === 0 && active) onExpire(); return }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [seconds, active])
  return seconds
}

const PHASES = { PREP: 'prep', ANSWER: 'answer', WAITING: 'waiting' }

export default function BattlePage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const monsterId = location.state?.monsterId

  const { battleId, monster, character, currentQuestion,
          monsterHp, characterHp, isOver, result,
          lastTurnResult, initBattle, applyTurnResult, resetBattle } = useBattleStore()

  const [phase,      setPhase]      = useState(PHASES.PREP)
  const [showPopup,  setShowPopup]  = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [initiated,  setInitiated]  = useState(false)

  // 배틀 시작
  useEffect(() => {
    if (!monsterId || initiated) return
    setInitiated(true)
    startBattle(monsterId).then(({ data }) => {
      initBattle(data.data)
      setPhase(PHASES.PREP)
    }).catch(() => navigate('/game'))
  }, [monsterId])

  const prepTime   = currentQuestion?.prepTime   ?? 45
  const answerTime = currentQuestion?.answerTime ?? 45

  const prepRemaining   = useTimer(prepTime,   () => setPhase(PHASES.ANSWER), phase === PHASES.PREP)
  const answerRemaining = useTimer(answerTime, handleAutoPass, phase === PHASES.ANSWER)

  function handleAutoPass() {
    handleAction('PASS', null)
  }

  const handleAction = useCallback(async (action, answerText) => {
    if (loading) return
    setLoading(true)
    setPhase(PHASES.WAITING)
    try {
      const { data } = await sendTurn({
        battleId,
        action,
        answerText: answerText || null,
        questionId: currentQuestion?.id || null,
      })
      applyTurnResult(data.data)
      setShowPopup(true)
    } finally {
      setLoading(false)
    }
  }, [battleId, currentQuestion, loading])

  const handleMicResult = (transcript) => handleAction('ATTACK', transcript)

  const handlePopupClose = () => {
    setShowPopup(false)
    if (isOver) {
      resetBattle()
      navigate('/game')
    } else {
      setPhase(PHASES.PREP)
    }
  }

  if (!monster || !character || !currentQuestion) {
    return (
      <div className="battle-root" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#a78bfa' }}>⚔️ 배틀 준비 중...</p>
      </div>
    )
  }

  return (
    <div className="battle-root">
      {/* 상단: 몬스터 HP */}
      <div className="battle-top">
        <span className="monster-name">👹 {monster.name}</span>
        <div style={{ flex: 1 }}>
          <HpBar current={monsterHp} max={monster.hp} />
        </div>
        <span style={{ fontSize: 13, color: '#f87171' }}>{monsterHp} / {monster.hp}</span>
      </div>

      {/* 중단: 문제 + 타이머 + 액션 */}
      <div className="battle-main">
        <div className="question-box">
          <div className="question-part">✦ {currentQuestion.toeicPart} ✦</div>
          <div className="question-text">{currentQuestion.text}</div>
        </div>

        <div className="timer-row">
          <div className="timer-box">
            <div className="timer-label">PREP TIME</div>
            <div className={`timer-value${phase === PHASES.PREP && prepRemaining <= 5 ? ' danger' : ''}`}>
              {phase === PHASES.PREP ? prepRemaining : '—'}
            </div>
          </div>
          <div style={{ width: 1, height: 40, background: 'rgba(147,51,234,0.3)' }} />
          <div className="timer-box">
            <div className="timer-label">ANSWER TIME</div>
            <div className={`timer-value${phase === PHASES.ANSWER && answerRemaining <= 5 ? ' danger' : ''}`}>
              {phase === PHASES.ANSWER ? answerRemaining : '—'}
            </div>
          </div>
        </div>

        {phase === PHASES.ANSWER && (
          <MicButton onResult={handleMicResult} disabled={loading} />
        )}

        <div className="battle-actions">
          {phase === PHASES.ANSWER && (
            <button className="action-btn attack" onClick={() => {}} disabled>
              🎤 말하기 (마이크 사용)
            </button>
          )}
          <button className="action-btn"
            onClick={() => handleAction('HINT', null)}
            disabled={loading || phase === PHASES.WAITING}>
            📖 힌트 (-20%)
          </button>
          <button className="action-btn"
            onClick={() => handleAction('PASS', null)}
            disabled={loading || phase === PHASES.WAITING}>
            ⏭️ 패스
          </button>
          <button className="action-btn"
            onClick={() => handleAction('FLEE', null)}
            disabled={loading}>
            🏃 도망
          </button>
        </div>
      </div>

      {/* 하단: 내 캐릭터 HP */}
      <div className="battle-bottom">
        <span className="char-name">🧙 {character.name}</span>
        <div style={{ flex: 1 }}>
          <HpBar current={characterHp} max={character.maxHp} />
        </div>
        <span style={{ fontSize: 13, color: '#a78bfa' }}>{characterHp} / {character.maxHp}</span>
      </div>

      {showPopup && lastTurnResult && (
        <ScorePopup result={{ ...lastTurnResult, isBattleOver: isOver }} onClose={handlePopupClose} />
      )}
    </div>
  )
}
```

- [ ] **Step 6: 빌드 확인**
```bash
cd frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 7: 커밋**
```bash
git add frontend/src/components/ frontend/src/pages/game/
git commit -m "feat: 배틀 페이지 (마이크 STT, HP바, 준비/답변 타이머, 채점 팝업)"
```

---

## Task 8: Redis 글로벌/주간 랭킹

**Files:**
- Create: `src/main/java/org/herotalk/ranking/RankingService.java`
- Create: `src/main/java/org/herotalk/ranking/RankingController.java`
- Create: `src/main/java/org/herotalk/ranking/RankingEntry.java`

- [ ] **Step 1: RankingEntry DTO**

```java
// src/main/java/org/herotalk/ranking/RankingEntry.java
package org.herotalk.ranking;
import lombok.Builder; import lombok.Getter;
@Getter @Builder
public class RankingEntry {
    private Long   userId;
    private String nickname;
    private long   score;   // XP 또는 클리어 시간
    private int    rank;
}
```

- [ ] **Step 2: RankingService 작성**

```java
// src/main/java/org/herotalk/ranking/RankingService.java
package org.herotalk.ranking;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.user.repository.UserRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RankingService {

    private final RedisTemplate<String, String> redisTemplate;
    private final UserRepository userRepository;

    private static final String GLOBAL_KEY = "ranking:global";
    private static final String WEEKLY_KEY = "ranking:weekly";

    /** 경험치 획득 시 글로벌/주간 랭킹 업데이트 */
    public void addExp(Long userId, int exp) {
        String member = String.valueOf(userId);
        redisTemplate.opsForZSet().incrementScore(GLOBAL_KEY, member, exp);
        redisTemplate.opsForZSet().incrementScore(WEEKLY_KEY, member, exp);
    }

    /** 글로벌 Top 100 조회 */
    public List<RankingEntry> getGlobalTop100() {
        return getTop(GLOBAL_KEY, 100);
    }

    /** 주간 Top 100 조회 */
    public List<RankingEntry> getWeeklyTop100() {
        return getTop(WEEKLY_KEY, 100);
    }

    /** 내 글로벌 랭킹 조회 */
    public long getMyGlobalRank(Long userId) {
        Long rank = redisTemplate.opsForZSet()
            .reverseRank(GLOBAL_KEY, String.valueOf(userId));
        return rank != null ? rank + 1 : -1;
    }

    private List<RankingEntry> getTop(String key, int count) {
        Set<ZSetOperations.TypedTuple<String>> tuples =
            redisTemplate.opsForZSet().reverseRangeWithScores(key, 0, count - 1);

        if (tuples == null) return List.of();

        List<RankingEntry> result = new ArrayList<>();
        int rank = 1;
        for (ZSetOperations.TypedTuple<String> tuple : tuples) {
            Long userId   = Long.parseLong(tuple.getValue());
            String nickname = userRepository.findById(userId)
                .map(u -> u.getNickname()).orElse("탈퇴한 유저");
            result.add(RankingEntry.builder()
                .userId(userId).nickname(nickname)
                .score(tuple.getScore().longValue()).rank(rank++).build());
        }
        return result;
    }
}
```

- [ ] **Step 3: RankingController 작성**

```java
// src/main/java/org/herotalk/ranking/RankingController.java
package org.herotalk.ranking;

import lombok.RequiredArgsConstructor;
import org.herotalk.global.response.ApiResponse;
import org.herotalk.security.util.SecurityUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rankings")
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;
    private final SecurityUtil   securityUtil;

    @GetMapping("/global")
    public ResponseEntity<ApiResponse<List<RankingEntry>>> global() {
        return ResponseEntity.ok(ApiResponse.ok(rankingService.getGlobalTop100()));
    }

    @GetMapping("/weekly")
    public ResponseEntity<ApiResponse<List<RankingEntry>>> weekly() {
        return ResponseEntity.ok(ApiResponse.ok(rankingService.getWeeklyTop100()));
    }

    @GetMapping("/my-rank")
    public ResponseEntity<ApiResponse<Long>> myRank() {
        return ResponseEntity.ok(ApiResponse.ok(
            rankingService.getMyGlobalRank(securityUtil.getCurrentUserId())));
    }
}
```

- [ ] **Step 4: BattleService에 랭킹 업데이트 추가**

`BattleService.processTurn`의 `character.addExp(expGained)` 직후에:
```java
rankingService.addExp(character.getUser().getId(), expGained);
```
`BattleService`에 `RankingService` 주입 추가.

- [ ] **Step 5: 컴파일 확인**
```bash
./gradlew compileJava 2>&1 | tail -5
```

- [ ] **Step 6: 커밋**
```bash
git add src/main/java/org/herotalk/ranking/
git commit -m "feat: Redis 글로벌/주간 랭킹 (Sorted Set)"
```

---

## Task 9: Phaser FieldScene (WASD 이동)

**Files:**
- Modify: `frontend/src/game/scenes/TownScene.js` — 실제 WASD 이동 구현
- Create: `frontend/src/game/scenes/FieldScene.js`

- [ ] **Step 1: TownScene 완성 (WASD + NPC 상호작용)**

```js
// frontend/src/game/scenes/TownScene.js
import Phaser from 'phaser'

export default class TownScene extends Phaser.Scene {
  constructor() { super({ key: 'TownScene' }) }

  create() {
    const W = this.cameras.main.width
    const H = this.cameras.main.height

    // 배경
    this.add.rectangle(W/2, H/2, W, H, 0x0d0628)

    // 마을 텍스트
    this.add.text(W/2, 60, '🏘️ 마을', {
      fontSize: '36px', fill: '#facc15',
      fontFamily: 'Cinzel, serif',
    }).setOrigin(0.5)

    // 플레이어 (간단한 사각형)
    this.player = this.add.rectangle(W/2, H/2, 32, 32, 0x7c3aed)
    this.physics.add.existing(this.player)
    this.player.body.setCollideWorldBounds(true)

    // 카메라
    this.cameras.main.startFollow(this.player)

    // 입력
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({ up:'W', down:'S', left:'A', right:'D' })

    // 상호작용 안내
    this.add.text(W/2, H - 40, 'WASD / 방향키 이동 · SPACE 상호작용 · ESC 메뉴', {
      fontSize: '13px', fill: 'rgba(196,181,253,0.5)',
    }).setOrigin(0.5).setScrollFactor(0)

    // 던전 입구 (클릭 → 배틀)
    const dungeonEntrance = this.add.text(W/2, H/2 - 120, '🌲 초보자 숲\n[SPACE] 입장', {
      fontSize: '16px', fill: '#22c55e', align: 'center',
    }).setOrigin(0.5).setInteractive()

    dungeonEntrance.on('pointerdown', () => {
      // monsterId: 1 (슬라임)을 state로 전달
      window.dispatchEvent(new CustomEvent('enterBattle', { detail: { monsterId: 1 } }))
    })
  }

  update() {
    const speed = 200
    const body  = this.player.body
    body.setVelocity(0)

    const left  = this.cursors.left.isDown  || this.wasd.left.isDown
    const right = this.cursors.right.isDown || this.wasd.right.isDown
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown

    if (left)  body.setVelocityX(-speed)
    if (right) body.setVelocityX(speed)
    if (up)    body.setVelocityY(-speed)
    if (down)  body.setVelocityY(speed)
  }
}
```

- [ ] **Step 2: GamePage에서 배틀 이벤트 수신**

```jsx
// GamePage.jsx의 useEffect에 추가
useEffect(() => {
  const handler = (e) => navigate('/battle', { state: { monsterId: e.detail.monsterId } })
  window.addEventListener('enterBattle', handler)
  return () => window.removeEventListener('enterBattle', handler)
}, [navigate])
```

- [ ] **Step 3: 빌드 확인**
```bash
cd frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 4: 커밋**
```bash
git add frontend/src/game/ frontend/src/pages/GamePage.jsx
git commit -m "feat: Phaser TownScene WASD 이동 + 던전 입장 이벤트"
```

---

## 최종 통합 확인

- [ ] **백엔드 전체 테스트 실행**
```bash
./gradlew test 2>&1 | grep -E "tests|failures|errors"
```

- [ ] **프론트엔드 빌드**
```bash
cd frontend && npm run build 2>&1 | tail -5
```

- [ ] **로컬 실행 테스트**
```bash
# 터미널 1: 백엔드 (H2 로컬 모드)
./gradlew bootRun --args='--spring.profiles.active=local'

# 터미널 2: 프론트엔드
cd frontend && npm run dev

# 접속
open http://localhost:3000/login
```

- [ ] **최종 커밋 & 푸시**
```bash
git add docs/superpowers/
git commit -m "docs: superpowers 구현 플랜 추가"
git push origin main
```

---

## 환경변수 체크리스트

| 변수 | 발급처 | 필수 여부 |
|------|--------|-----------|
| `KAKAO_CLIENT_ID` | developers.kakao.com | 카카오 로그인 시 |
| `KAKAO_CLIENT_SECRET` | developers.kakao.com | 카카오 로그인 시 |
| `GOOGLE_CLIENT_ID` | console.cloud.google.com | 구글 로그인 시 |
| `GOOGLE_CLIENT_SECRET` | console.cloud.google.com | 구글 로그인 시 |
| `GEMINI_API_KEY` | aistudio.google.com | AI 채점 시 |
| `JWT_SECRET` | `openssl rand -base64 64` | 항상 필요 |
| `DB_USERNAME` / `DB_PASSWORD` | MySQL 설정 | 운영 시 |
