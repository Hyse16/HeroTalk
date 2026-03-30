# 어드민 시스템 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ADMIN 역할 기반 독립 대시보드를 추가한다 — 어드민은 문제/몬스터/아이템/회원/랭킹을 관리하며 일반 게임도 플레이 가능하다.

**Architecture:** 기존 Spring Boot 백엔드에 `/api/admin/**` 엔드포인트 추가, React에 `/admin` 라우트 추가. Role Hierarchy (ADMIN > USER), 권한은 DB 기반으로 결정.

**Tech Stack:** Spring Boot 3.2.5, Spring Security 6, JWT (jjwt 0.12.3), React 18, Zustand, React Router v6

**Spec:** `docs/superpowers/specs/2026-03-30-admin-system-design.md`

---

## 파일 맵

### 백엔드 수정
- `src/main/java/org/herotalk/domain/user/entity/User.java` — Role enum + 필드, password @JsonIgnore, activate/deactivate 메서드
- `src/main/java/org/herotalk/security/CustomUserDetails.java` — Role 파라미터, DB role → Authority, isActive → isEnabled
- `src/main/java/org/herotalk/security/CustomUserDetailsService.java` — role, isActive 전달
- `src/main/java/org/herotalk/security/SecurityConfig.java` — RoleHierarchy + DefaultWebSecurityExpressionHandler + /api/admin/** ADMIN 보호
- `src/main/java/org/herotalk/domain/auth/dto/AuthResponse.java` — role 필드 추가
- `src/main/java/org/herotalk/domain/auth/service/AuthService.java` — signup/login/refresh에 role 포함
- `src/main/java/org/herotalk/security/oauth2/OAuth2SuccessHandler.java` — role 쿼리 파라미터 추가
- `src/main/java/org/herotalk/global/init/DataInitializer.java` — 어드민 계정 생성 최상단 배치
- `src/main/java/org/herotalk/domain/question/entity/Question.java` — update 메서드
- `src/main/java/org/herotalk/domain/dungeon/entity/Monster.java` — update 메서드
- `src/main/java/org/herotalk/domain/item/entity/Item.java` — update 메서드
- `src/main/java/org/herotalk/domain/item/entity/Cosmetic.java` — update 메서드
- `src/test/resources/application.yml` — ADMIN_PASSWORD 테스트값 추가

### 백엔드 신규
- `src/main/java/org/herotalk/domain/admin/dto/AdminQuestionRequest.java`
- `src/main/java/org/herotalk/domain/admin/dto/AdminMonsterRequest.java`
- `src/main/java/org/herotalk/domain/admin/dto/AdminItemRequest.java`
- `src/main/java/org/herotalk/domain/admin/dto/AdminCosmeticRequest.java`
- `src/main/java/org/herotalk/domain/admin/controller/AdminQuestionController.java`
- `src/main/java/org/herotalk/domain/admin/controller/AdminMonsterController.java`
- `src/main/java/org/herotalk/domain/admin/controller/AdminItemController.java`
- `src/main/java/org/herotalk/domain/admin/controller/AdminCosmeticController.java`
- `src/main/java/org/herotalk/domain/admin/controller/AdminUserController.java`
- `src/main/java/org/herotalk/domain/admin/controller/AdminRankingController.java`
- `src/main/java/org/herotalk/domain/admin/service/AdminQuestionService.java`
- `src/main/java/org/herotalk/domain/admin/service/AdminMonsterService.java`
- `src/main/java/org/herotalk/domain/admin/service/AdminItemService.java`
- `src/main/java/org/herotalk/domain/admin/service/AdminCosmeticService.java`
- `src/main/java/org/herotalk/domain/admin/service/AdminUserService.java`
- `src/main/java/org/herotalk/domain/admin/service/AdminRankingService.java`

### 프론트엔드 수정
- `frontend/src/store/authStore.js` — role 저장 + 분기
- `frontend/src/App.jsx` — AdminRoute + /admin 라우트
- `frontend/src/pages/auth/LoginPage.jsx` — role 파싱 + 분기

### 프론트엔드 신규
- `frontend/src/api/adminApi.js`
- `frontend/src/components/admin/AdminLayout.jsx`
- `frontend/src/components/admin/AdminLayout.css`
- `frontend/src/pages/admin/AdminDashboard.jsx`
- `frontend/src/pages/admin/AdminQuestions.jsx`
- `frontend/src/pages/admin/AdminMonsters.jsx`
- `frontend/src/pages/admin/AdminItems.jsx`
- `frontend/src/pages/admin/AdminUsers.jsx`
- `frontend/src/pages/admin/AdminRankings.jsx`

---

## Task 1: 테스트 환경 ADMIN_PASSWORD 설정

**Files:**
- Modify: `src/test/resources/application.yml`

> **주의:** `@SpringBootTest` 기반 테스트가 실행될 때 DataInitializer가 구동되어 ADMIN_PASSWORD를 찾는다. 다른 모든 Task보다 먼저 처리해야 한다.

- [ ] **Step 1: `src/test/resources/application.yml` 하단에 추가**

```yaml
ADMIN_PASSWORD: test-admin-password
```

- [ ] **Step 2: Commit**

```bash
git add src/test/resources/application.yml
git commit -m "test: ADMIN_PASSWORD 테스트 환경변수 추가"
```

---

## Task 2: User 엔티티 Role 추가 + password 노출 방지

**Files:**
- Modify: `src/main/java/org/herotalk/domain/user/entity/User.java`

- [ ] **Step 1: `User.java` 수정**

아래 내용을 `User.java`에 추가한다.

```java
// import 추가
import com.fasterxml.jackson.annotation.JsonIgnore;

// Role enum 추가 (Provider enum 아래)
public enum Role { USER, ADMIN }

// 필드 추가
@Enumerated(EnumType.STRING)
@Column(name = "role", nullable = false)
@Builder.Default
private Role role = Role.USER;

// password 필드에 @JsonIgnore 추가 (어드민 API에서 User 직접 반환 시 노출 방지)
@JsonIgnore
@Column(name = "password", length = 255)
private String password;

// activate/deactivate 메서드 추가
public void activate()   { this.isActive = true; }
public void deactivate() { this.isActive = false; }
```

`createLocal`, `createSocial` 팩토리 메서드는 건드리지 않는다 (role 기본값 USER 자동 적용).

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/hyeonseung/Desktop/HeroTalk
./gradlew compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add src/main/java/org/herotalk/domain/user/entity/User.java
git commit -m "feat: User 엔티티 Role enum 추가 + password @JsonIgnore + activate/deactivate"
```

---

## Task 3: CustomUserDetails + CustomUserDetailsService 수정

**Files:**
- Modify: `src/main/java/org/herotalk/security/CustomUserDetails.java`
- Modify: `src/main/java/org/herotalk/security/CustomUserDetailsService.java`

- [ ] **Step 1: `CustomUserDetails.java` 전체 교체**

```java
package org.herotalk.security;

import lombok.Getter;
import org.herotalk.domain.user.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
public class CustomUserDetails implements UserDetails {

    private final Long userId;
    private final String email;
    private final String password;
    private final Collection<? extends GrantedAuthority> authorities;
    private final boolean isActive;

    public CustomUserDetails(Long userId, String email, String password, User.Role role, boolean isActive) {
        this.userId = userId;
        this.email = email;
        this.password = password;
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
        this.isActive = isActive;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }

    @Override
    public String getPassword() { return password; }

    @Override
    public String getUsername() { return email; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return isActive; }
}
```

- [ ] **Step 2: `CustomUserDetailsService.java` 수정**

`loadUserByUsername` return 문을 교체:

```java
return new CustomUserDetails(
        user.getId(),
        user.getEmail(),
        user.getPassword(),
        user.getRole(),
        user.isActive()
);
```

- [ ] **Step 3: 단위 테스트 작성**

`src/test/java/org/herotalk/security/CustomUserDetailsTest.java` 생성:

```java
package org.herotalk.security;

import org.herotalk.domain.user.entity.User;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class CustomUserDetailsTest {

    @Test
    void ADMIN_역할_유저는_ROLE_ADMIN_권한을_가진다() {
        var details = new CustomUserDetails(1L, "admin@test.com", "pw", User.Role.ADMIN, true);
        assertThat(details.getAuthorities()).extracting("authority").containsExactly("ROLE_ADMIN");
    }

    @Test
    void USER_역할_유저는_ROLE_USER_권한을_가진다() {
        var details = new CustomUserDetails(2L, "user@test.com", "pw", User.Role.USER, true);
        assertThat(details.getAuthorities()).extracting("authority").containsExactly("ROLE_USER");
    }

    @Test
    void 비활성화_유저는_isEnabled가_false다() {
        var details = new CustomUserDetails(3L, "inactive@test.com", "pw", User.Role.USER, false);
        assertThat(details.isEnabled()).isFalse();
    }

    @Test
    void 활성화_유저는_isEnabled가_true다() {
        var details = new CustomUserDetails(4L, "active@test.com", "pw", User.Role.USER, true);
        assertThat(details.isEnabled()).isTrue();
    }
}
```

- [ ] **Step 4: 테스트 실행 (컨텍스트 로드 없는 순수 단위 테스트)**

```bash
./gradlew test --tests "org.herotalk.security.CustomUserDetailsTest"
```
Expected: 4 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/main/java/org/herotalk/security/CustomUserDetails.java \
        src/main/java/org/herotalk/security/CustomUserDetailsService.java \
        src/test/java/org/herotalk/security/CustomUserDetailsTest.java
git commit -m "feat: CustomUserDetails DB role 기반 권한 + isActive → isEnabled 연결"
```

---

## Task 4: SecurityConfig Role Hierarchy + 경로 권한

**Files:**
- Modify: `src/main/java/org/herotalk/security/SecurityConfig.java`

- [ ] **Step 1: `SecurityConfig.java` 수정**

아래 import 추가:

```java
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.web.access.expression.DefaultWebSecurityExpressionHandler;
```

`filterChain` 메서드의 `authorizeHttpRequests` 블록 교체:

```java
.authorizeHttpRequests(auth -> auth
    .expressionHandler(expressionHandler())
    .requestMatchers(
            "/api/auth/**",
            "/api/dungeons/**",
            "/login/oauth2/**",
            "/oauth2/**",
            "/actuator/health",
            "/h2-console/**"
    ).permitAll()
    .requestMatchers("/api/admin/**").hasRole("ADMIN")
    .anyRequest().authenticated())
```

Bean 2개 추가 (기존 Bean 목록 하단에):

```java
@Bean
public RoleHierarchy roleHierarchy() {
    return RoleHierarchyImpl.withDefaultRolePrefix()
            .role("ADMIN").implies("USER")
            .build();
}

@Bean
public DefaultWebSecurityExpressionHandler expressionHandler() {
    DefaultWebSecurityExpressionHandler handler = new DefaultWebSecurityExpressionHandler();
    handler.setRoleHierarchy(roleHierarchy());
    return handler;
}
```

- [ ] **Step 2: 빌드 확인**

```bash
./gradlew compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 3: 통합 테스트 작성**

`src/test/java/org/herotalk/security/SecurityConfigTest.java`:

```java
package org.herotalk.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void 인증_없이_admin_경로_접근하면_401이다() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isUnauthorized());
    }
}
```

- [ ] **Step 4: 테스트 실행**

```bash
./gradlew test --tests "org.herotalk.security.SecurityConfigTest"
```
Expected: 1 test passed

- [ ] **Step 5: Commit**

```bash
git add src/main/java/org/herotalk/security/SecurityConfig.java \
        src/test/java/org/herotalk/security/SecurityConfigTest.java
git commit -m "feat: SecurityConfig RoleHierarchy + expressionHandler + /api/admin/** ADMIN 보호"
```

---

## Task 5: AuthResponse + AuthService + OAuth2SuccessHandler role 포함

**Files:**
- Modify: `src/main/java/org/herotalk/domain/auth/dto/AuthResponse.java`
- Modify: `src/main/java/org/herotalk/domain/auth/service/AuthService.java`
- Modify: `src/main/java/org/herotalk/security/oauth2/OAuth2SuccessHandler.java`

- [ ] **Step 1: `AuthResponse.java`에 role 필드 추가**

```java
@Getter
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private Long userId;
    private String nickname;
    private boolean newUser;
    private String role;   // 추가
}
```

- [ ] **Step 2: `AuthService.java` — signup, login, refresh 각 return 블록에 `.role(xxx.getRole().name())` 추가**

`signup`:
```java
return AuthResponse.builder()
        .accessToken(accessToken)
        .refreshToken(refreshToken)
        .userId(savedUser.getId())
        .nickname(savedUser.getNickname())
        .newUser(true)
        .role(savedUser.getRole().name())
        .build();
```

`login`:
```java
return AuthResponse.builder()
        .accessToken(accessToken)
        .refreshToken(refreshToken)
        .userId(user.getId())
        .nickname(user.getNickname())
        .newUser(false)
        .role(user.getRole().name())
        .build();
```

`refresh`:
```java
return AuthResponse.builder()
        .accessToken(newAccessToken)
        .refreshToken(newRefreshToken)
        .userId(user.getId())
        .nickname(user.getNickname())
        .newUser(false)
        .role(user.getRole().name())
        .build();
```

- [ ] **Step 3: `OAuth2SuccessHandler.java` — role 쿼리 파라미터 추가**

기존 userId로 email만 조회하는 부분을 수정:

```java
// import 추가
import org.herotalk.domain.user.entity.User;

// 기존 email 조회 부분 수정
var userOpt = userRepository.findById(userId);
String email = userOpt.map(User::getEmail).orElse("");
String role = userOpt.map(u -> u.getRole().name()).orElse("USER");

// redirectUrl 빌드 수정
String redirectUrl = UriComponentsBuilder
        .fromUriString(frontendUrl + "/login")
        .queryParam("token",   accessToken)
        .queryParam("refresh", refreshToken)
        .queryParam("isNew",   !hasCharacter)
        .queryParam("role",    role)
        .build().toUriString();
```

- [ ] **Step 4: 빌드 확인**

```bash
./gradlew compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 5: Commit**

```bash
git add src/main/java/org/herotalk/domain/auth/dto/AuthResponse.java \
        src/main/java/org/herotalk/domain/auth/service/AuthService.java \
        src/main/java/org/herotalk/security/oauth2/OAuth2SuccessHandler.java
git commit -m "feat: AuthResponse + AuthService + OAuth2SuccessHandler에 role 필드 추가"
```

---

## Task 6: DataInitializer 어드민 계정 생성

**Files:**
- Modify: `src/main/java/org/herotalk/global/init/DataInitializer.java`

- [ ] **Step 1: `DataInitializer.java` 수정**

클래스에 필드 추가 (`@RequiredArgsConstructor`가 자동 주입):

```java
// import 추가
import org.herotalk.domain.user.entity.User;
import org.herotalk.domain.user.repository.UserRepository;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;

// 클래스 필드 추가 (기존 필드들 하단에)
private final UserRepository userRepository;
private final PasswordEncoder passwordEncoder;
private final Environment environment;
```

`run()` 메서드를 아래로 교체:

```java
@Override
@Transactional
public void run(String... args) {
    // 1. 어드민 계정 생성 (던전 시드와 독립적으로 항상 먼저 실행)
    if (userRepository.findByEmail("admin@herotalk.com").isEmpty()) {
        String adminPassword = environment.getProperty("ADMIN_PASSWORD");
        if (adminPassword == null || adminPassword.isBlank()) {
            throw new IllegalStateException(
                "ADMIN_PASSWORD 환경변수가 설정되지 않았습니다. 서버를 시작할 수 없습니다."
            );
        }
        User admin = User.builder()
                .email("admin@herotalk.com")
                .password(passwordEncoder.encode(adminPassword))
                .nickname("관리자")
                .role(User.Role.ADMIN)
                .provider(User.Provider.LOCAL)
                .isActive(true)
                .build();
        userRepository.save(admin);
        log.info("[DataInitializer] 초기 어드민 계정 생성 완료: admin@herotalk.com");
    }

    // 2. 던전 시드 데이터 (기존 조기 반환 유지)
    if (dungeonRepository.count() > 0) {
        log.info("[DataInitializer] 시드 데이터 이미 존재합니다. 건너뜁니다.");
        return;
    }

    log.info("[DataInitializer] 시드 데이터 삽입 시작...");
    // 기존 시드 메서드 호출 유지
    List<Dungeon> dungeons = seedDungeons();
    seedMonsters(dungeons);
    seedQuestions();
    seedItems();
    seedCosmetics();
    seedDailyQuests();
    log.info("[DataInitializer] 시드 데이터 삽입 완료.");
}
```

- [ ] **Step 2: 전체 테스트 실행 (DataInitializer 포함 컨텍스트 검증)**

```bash
./gradlew test
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add src/main/java/org/herotalk/global/init/DataInitializer.java
git commit -m "feat: DataInitializer 초기 어드민 계정 자동 생성 (ADMIN_PASSWORD 필수)"
```

---

## Task 7: Admin API — 문제(Question) CRUD

**Files:**
- Create: `src/main/java/org/herotalk/domain/admin/dto/AdminQuestionRequest.java`
- Create: `src/main/java/org/herotalk/domain/admin/service/AdminQuestionService.java`
- Create: `src/main/java/org/herotalk/domain/admin/controller/AdminQuestionController.java`
- Modify: `src/main/java/org/herotalk/domain/question/entity/Question.java`

- [ ] **Step 1: `AdminQuestionRequest.java` 작성**

```java
package org.herotalk.domain.admin.dto;

import lombok.Getter;
import org.herotalk.domain.dungeon.entity.Dungeon;

@Getter
public class AdminQuestionRequest {
    private Dungeon.ToeicPart toeicPart;
    private int difficulty;
    private String questionText;
    private String imageUrl;
    private String contextData;
    private int prepTime;
    private int answerTime;
    private String sampleAnswer;
    private String hint;
}
```

- [ ] **Step 2: `Question.java`에 update 메서드 추가**

```java
public Question update(Dungeon.ToeicPart toeicPart, int difficulty, String questionText,
                       String imageUrl, String contextData, int prepTime,
                       int answerTime, String sampleAnswer, String hint) {
    this.toeicPart = toeicPart;
    this.difficulty = difficulty;
    this.questionText = questionText;
    this.imageUrl = imageUrl;
    this.contextData = contextData;
    this.prepTime = prepTime;
    this.answerTime = answerTime;
    this.sampleAnswer = sampleAnswer;
    this.hint = hint;
    return this;
}
```

- [ ] **Step 3: `AdminQuestionService.java` 작성**

```java
package org.herotalk.domain.admin.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.dto.AdminQuestionRequest;
import org.herotalk.domain.question.entity.Question;
import org.herotalk.domain.question.repository.QuestionRepository;
import org.herotalk.global.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminQuestionService {

    private final QuestionRepository questionRepository;

    @Transactional(readOnly = true)
    public Page<Question> getQuestions(Pageable pageable) {
        return questionRepository.findAll(pageable);
    }

    @Transactional
    public Question create(AdminQuestionRequest req) {
        Question question = Question.builder()
                .toeicPart(req.getToeicPart())
                .difficulty(req.getDifficulty())
                .questionText(req.getQuestionText())
                .imageUrl(req.getImageUrl())
                .contextData(req.getContextData())
                .prepTime(req.getPrepTime())
                .answerTime(req.getAnswerTime())
                .sampleAnswer(req.getSampleAnswer())
                .hint(req.getHint())
                .build();
        return questionRepository.save(question);
    }

    @Transactional
    public Question update(Long id, AdminQuestionRequest req) {
        Question q = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", id));
        return q.update(req.getToeicPart(), req.getDifficulty(), req.getQuestionText(),
                req.getImageUrl(), req.getContextData(), req.getPrepTime(),
                req.getAnswerTime(), req.getSampleAnswer(), req.getHint());
    }

    @Transactional
    public void delete(Long id) {
        questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", id));
        questionRepository.deleteById(id);
    }
}
```

- [ ] **Step 4: `AdminQuestionController.java` 작성**

```java
package org.herotalk.domain.admin.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.dto.AdminQuestionRequest;
import org.herotalk.domain.admin.service.AdminQuestionService;
import org.herotalk.domain.question.entity.Question;
import org.herotalk.global.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/questions")
@RequiredArgsConstructor
public class AdminQuestionController {

    private final AdminQuestionService adminQuestionService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Question>>> getQuestions(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(adminQuestionService.getQuestions(pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Question>> create(@RequestBody AdminQuestionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(adminQuestionService.create(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Question>> update(
            @PathVariable Long id, @RequestBody AdminQuestionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(adminQuestionService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        adminQuestionService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
```

- [ ] **Step 5: 빌드 확인**

```bash
./gradlew compileJava
```

- [ ] **Step 6: Commit**

```bash
git add src/main/java/org/herotalk/domain/admin/ \
        src/main/java/org/herotalk/domain/question/entity/Question.java
git commit -m "feat: Admin API — 문제(Question) CRUD 구현"
```

---

## Task 8: Admin API — 몬스터(Monster) CRUD

**Files:**
- Create: `src/main/java/org/herotalk/domain/admin/dto/AdminMonsterRequest.java`
- Create: `src/main/java/org/herotalk/domain/admin/service/AdminMonsterService.java`
- Create: `src/main/java/org/herotalk/domain/admin/controller/AdminMonsterController.java`
- Modify: `src/main/java/org/herotalk/domain/dungeon/entity/Monster.java`

- [ ] **Step 1: `AdminMonsterRequest.java` 작성**

```java
package org.herotalk.domain.admin.dto;

import lombok.Getter;
import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.dungeon.entity.Monster;

@Getter
public class AdminMonsterRequest {
    private Long dungeonId;
    private String name;
    private Monster.MonsterType monsterType;
    private int hp;
    private int attackPower;
    private int expReward;
    private int goldReward;
    private Dungeon.ToeicPart toeicPart;
    private int difficulty;
}
```

- [ ] **Step 2: `Monster.java`에 update 메서드 추가**

```java
public Monster update(String name, MonsterType monsterType, int hp, int attackPower,
                      int expReward, int goldReward, Dungeon.ToeicPart toeicPart, int difficulty) {
    this.name = name;
    this.monsterType = monsterType;
    this.hp = hp;
    this.attackPower = attackPower;
    this.expReward = expReward;
    this.goldReward = goldReward;
    this.toeicPart = toeicPart;
    this.difficulty = difficulty;
    return this;
}
```

> 참고: 몬스터의 던전 소속은 수정 시 변경하지 않는다 (생성 시 결정). 운영 중 던전 이동이 필요하면 삭제 후 재생성.

- [ ] **Step 3: `AdminMonsterService.java` 작성**

```java
package org.herotalk.domain.admin.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.dto.AdminMonsterRequest;
import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.dungeon.entity.Monster;
import org.herotalk.domain.dungeon.repository.DungeonRepository;
import org.herotalk.domain.dungeon.repository.MonsterRepository;
import org.herotalk.global.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminMonsterService {

    private final MonsterRepository monsterRepository;
    private final DungeonRepository dungeonRepository;

    @Transactional(readOnly = true)
    public Page<Monster> getMonsters(Pageable pageable) {
        return monsterRepository.findAll(pageable);
    }

    @Transactional
    public Monster create(AdminMonsterRequest req) {
        Dungeon dungeon = dungeonRepository.findById(req.getDungeonId())
                .orElseThrow(() -> new ResourceNotFoundException("Dungeon", req.getDungeonId()));
        Monster monster = Monster.builder()
                .dungeon(dungeon)
                .name(req.getName())
                .monsterType(req.getMonsterType())
                .hp(req.getHp())
                .attackPower(req.getAttackPower())
                .expReward(req.getExpReward())
                .goldReward(req.getGoldReward())
                .toeicPart(req.getToeicPart())
                .difficulty(req.getDifficulty())
                .build();
        return monsterRepository.save(monster);
    }

    @Transactional
    public Monster update(Long id, AdminMonsterRequest req) {
        Monster m = monsterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Monster", id));
        return m.update(req.getName(), req.getMonsterType(), req.getHp(),
                req.getAttackPower(), req.getExpReward(), req.getGoldReward(),
                req.getToeicPart(), req.getDifficulty());
    }

    @Transactional
    public void delete(Long id) {
        monsterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Monster", id));
        monsterRepository.deleteById(id);
    }
}
```

- [ ] **Step 4: `AdminMonsterController.java` 작성**

```java
package org.herotalk.domain.admin.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.dto.AdminMonsterRequest;
import org.herotalk.domain.admin.service.AdminMonsterService;
import org.herotalk.domain.dungeon.entity.Monster;
import org.herotalk.global.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/monsters")
@RequiredArgsConstructor
public class AdminMonsterController {

    private final AdminMonsterService adminMonsterService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Monster>>> getMonsters(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(adminMonsterService.getMonsters(pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Monster>> create(@RequestBody AdminMonsterRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(adminMonsterService.create(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Monster>> update(
            @PathVariable Long id, @RequestBody AdminMonsterRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(adminMonsterService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        adminMonsterService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
```

- [ ] **Step 5: 빌드 확인**

```bash
./gradlew compileJava
```

- [ ] **Step 6: Commit**

```bash
git add src/main/java/org/herotalk/domain/admin/ \
        src/main/java/org/herotalk/domain/dungeon/entity/Monster.java
git commit -m "feat: Admin API — 몬스터(Monster) CRUD 구현"
```

---

## Task 9: Admin API — 아이템(Item) CRUD

**Files:**
- Create: `src/main/java/org/herotalk/domain/admin/dto/AdminItemRequest.java`
- Create: `src/main/java/org/herotalk/domain/admin/service/AdminItemService.java`
- Create: `src/main/java/org/herotalk/domain/admin/controller/AdminItemController.java`
- Modify: `src/main/java/org/herotalk/domain/item/entity/Item.java`

- [ ] **Step 1: `AdminItemRequest.java` 작성**

```java
package org.herotalk.domain.admin.dto;

import lombok.Getter;
import org.herotalk.domain.item.entity.Item;

@Getter
public class AdminItemRequest {
    private String name;
    private String description;
    private Item.ItemType itemType;
    private int effectValue;
    private int price;
}
```

- [ ] **Step 2: `Item.java`에 update 메서드 추가**

```java
public Item update(String name, String description, ItemType itemType, int effectValue, int price) {
    this.name = name;
    this.description = description;
    this.itemType = itemType;
    this.effectValue = effectValue;
    this.price = price;
    return this;
}
```

- [ ] **Step 3: `AdminItemService.java` 작성**

```java
package org.herotalk.domain.admin.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.dto.AdminItemRequest;
import org.herotalk.domain.item.entity.Item;
import org.herotalk.domain.item.repository.ItemRepository;
import org.herotalk.global.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminItemService {

    private final ItemRepository itemRepository;

    @Transactional(readOnly = true)
    public Page<Item> getItems(Pageable pageable) {
        return itemRepository.findAll(pageable);
    }

    @Transactional
    public Item create(AdminItemRequest req) {
        return itemRepository.save(Item.builder()
                .name(req.getName()).description(req.getDescription())
                .itemType(req.getItemType()).effectValue(req.getEffectValue())
                .price(req.getPrice()).build());
    }

    @Transactional
    public Item update(Long id, AdminItemRequest req) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item", id));
        return item.update(req.getName(), req.getDescription(),
                req.getItemType(), req.getEffectValue(), req.getPrice());
    }

    @Transactional
    public void delete(Long id) {
        itemRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Item", id));
        itemRepository.deleteById(id);
    }
}
```

- [ ] **Step 4: `AdminItemController.java` 작성**

```java
package org.herotalk.domain.admin.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.dto.AdminItemRequest;
import org.herotalk.domain.admin.service.AdminItemService;
import org.herotalk.domain.item.entity.Item;
import org.herotalk.global.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/items")
@RequiredArgsConstructor
public class AdminItemController {

    private final AdminItemService adminItemService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Item>>> getItems(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(adminItemService.getItems(pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Item>> create(@RequestBody AdminItemRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(adminItemService.create(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Item>> update(@PathVariable Long id, @RequestBody AdminItemRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(adminItemService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        adminItemService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
```

- [ ] **Step 5: 빌드 확인**

```bash
./gradlew compileJava
```

- [ ] **Step 6: Commit**

```bash
git add src/main/java/org/herotalk/domain/admin/ \
        src/main/java/org/herotalk/domain/item/entity/Item.java
git commit -m "feat: Admin API — 아이템(Item) CRUD 구현"
```

---

## Task 10: Admin API — 코스튬(Cosmetic) CRUD

**Files:**
- Create: `src/main/java/org/herotalk/domain/admin/dto/AdminCosmeticRequest.java`
- Create: `src/main/java/org/herotalk/domain/admin/service/AdminCosmeticService.java`
- Create: `src/main/java/org/herotalk/domain/admin/controller/AdminCosmeticController.java`
- Modify: `src/main/java/org/herotalk/domain/item/entity/Cosmetic.java`

- [ ] **Step 1: `AdminCosmeticRequest.java` 작성**

```java
package org.herotalk.domain.admin.dto;

import lombok.Getter;
import org.herotalk.domain.item.entity.Cosmetic;

@Getter
public class AdminCosmeticRequest {
    private String name;
    private Cosmetic.CosmeticType cosmeticType;
    private String description;
    private String imageUrl;
    private int price;
    private Cosmetic.Rarity rarity;
}
```

- [ ] **Step 2: `Cosmetic.java`에 update 메서드 추가**

```java
public Cosmetic update(String name, CosmeticType cosmeticType, String description,
                       String imageUrl, int price, Rarity rarity) {
    this.name = name;
    this.cosmeticType = cosmeticType;
    this.description = description;
    this.imageUrl = imageUrl;
    this.price = price;
    this.rarity = rarity;
    return this;
}
```

- [ ] **Step 3: `AdminCosmeticService.java` 작성**

```java
package org.herotalk.domain.admin.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.dto.AdminCosmeticRequest;
import org.herotalk.domain.item.entity.Cosmetic;
import org.herotalk.domain.item.repository.CosmeticRepository;
import org.herotalk.global.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminCosmeticService {

    private final CosmeticRepository cosmeticRepository;

    @Transactional(readOnly = true)
    public Page<Cosmetic> getCosmetics(Pageable pageable) {
        return cosmeticRepository.findAll(pageable);
    }

    @Transactional
    public Cosmetic create(AdminCosmeticRequest req) {
        return cosmeticRepository.save(Cosmetic.builder()
                .name(req.getName()).cosmeticType(req.getCosmeticType())
                .description(req.getDescription()).imageUrl(req.getImageUrl())
                .price(req.getPrice()).rarity(req.getRarity()).build());
    }

    @Transactional
    public Cosmetic update(Long id, AdminCosmeticRequest req) {
        Cosmetic c = cosmeticRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cosmetic", id));
        return c.update(req.getName(), req.getCosmeticType(), req.getDescription(),
                req.getImageUrl(), req.getPrice(), req.getRarity());
    }

    @Transactional
    public void delete(Long id) {
        cosmeticRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Cosmetic", id));
        cosmeticRepository.deleteById(id);
    }
}
```

- [ ] **Step 4: `AdminCosmeticController.java` 작성**

```java
package org.herotalk.domain.admin.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.dto.AdminCosmeticRequest;
import org.herotalk.domain.admin.service.AdminCosmeticService;
import org.herotalk.domain.item.entity.Cosmetic;
import org.herotalk.global.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/cosmetics")
@RequiredArgsConstructor
public class AdminCosmeticController {

    private final AdminCosmeticService adminCosmeticService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Cosmetic>>> getCosmetics(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(adminCosmeticService.getCosmetics(pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Cosmetic>> create(@RequestBody AdminCosmeticRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(adminCosmeticService.create(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Cosmetic>> update(@PathVariable Long id, @RequestBody AdminCosmeticRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(adminCosmeticService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        adminCosmeticService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
```

- [ ] **Step 5: 빌드 확인**

```bash
./gradlew compileJava
```

- [ ] **Step 6: Commit**

```bash
git add src/main/java/org/herotalk/domain/admin/ \
        src/main/java/org/herotalk/domain/item/entity/Cosmetic.java
git commit -m "feat: Admin API — 코스튬(Cosmetic) CRUD 구현"
```

---

## Task 11: Admin API — 회원 관리 + 랭킹 관리

**Files:**
- Create: `src/main/java/org/herotalk/domain/admin/service/AdminUserService.java`
- Create: `src/main/java/org/herotalk/domain/admin/controller/AdminUserController.java`
- Create: `src/main/java/org/herotalk/domain/admin/service/AdminRankingService.java`
- Create: `src/main/java/org/herotalk/domain/admin/controller/AdminRankingController.java`

- [ ] **Step 1: `AdminUserService.java` 작성**

```java
package org.herotalk.domain.admin.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.user.entity.User;
import org.herotalk.domain.user.repository.UserRepository;
import org.herotalk.global.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<User> getUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Transactional
    public User toggleStatus(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        if (user.getRole() == User.Role.ADMIN) {
            throw new IllegalArgumentException("ADMIN 계정은 비활성화할 수 없습니다.");
        }
        if (user.isActive()) user.deactivate();
        else user.activate();
        return user;
    }
}
```

- [ ] **Step 2: `AdminUserController.java` 작성**

```java
package org.herotalk.domain.admin.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.service.AdminUserService;
import org.herotalk.domain.user.entity.User;
import org.herotalk.global.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<User>>> getUsers(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(adminUserService.getUsers(pageable)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<User>> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(adminUserService.toggleStatus(id)));
    }
}
```

- [ ] **Step 3: `AdminRankingService.java` 작성**

```java
package org.herotalk.domain.admin.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.ranking.dto.RankingEntry;
import org.herotalk.domain.ranking.service.RankingService;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminRankingService {

    private static final String WEEKLY_KEY = "ranking:weekly";

    private final RankingService rankingService;
    private final RedisTemplate<String, String> redisTemplate;

    public List<RankingEntry> getGlobalRanking() {
        return rankingService.getGlobalRanking(100);
    }

    public List<RankingEntry> getWeeklyRanking() {
        return rankingService.getWeeklyRanking(100);
    }

    public void clearWeeklyRanking() {
        redisTemplate.delete(WEEKLY_KEY);
    }
}
```

- [ ] **Step 4: `AdminRankingController.java` 작성**

```java
package org.herotalk.domain.admin.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.service.AdminRankingService;
import org.herotalk.domain.ranking.dto.RankingEntry;
import org.herotalk.global.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/rankings")
@RequiredArgsConstructor
public class AdminRankingController {

    private final AdminRankingService adminRankingService;

    @GetMapping("/global")
    public ResponseEntity<ApiResponse<List<RankingEntry>>> getGlobal() {
        return ResponseEntity.ok(ApiResponse.ok(adminRankingService.getGlobalRanking()));
    }

    @GetMapping("/weekly")
    public ResponseEntity<ApiResponse<List<RankingEntry>>> getWeekly() {
        return ResponseEntity.ok(ApiResponse.ok(adminRankingService.getWeeklyRanking()));
    }

    @DeleteMapping("/weekly")
    public ResponseEntity<ApiResponse<Void>> clearWeekly() {
        adminRankingService.clearWeeklyRanking();
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
```

- [ ] **Step 5: 전체 빌드 + 테스트**

```bash
./gradlew build
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 6: Commit**

```bash
git add src/main/java/org/herotalk/domain/admin/
git commit -m "feat: Admin API — 회원 관리 + 랭킹 조회/초기화 구현"
```

---

## Task 12: 프론트엔드 — authStore + LoginPage 수정

**Files:**
- Modify: `frontend/src/store/authStore.js`
- Modify: `frontend/src/pages/auth/LoginPage.jsx`

- [ ] **Step 1: `authStore.js` 전체 교체**

```js
import { create } from 'zustand'
import useCharacterStore from './characterStore'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken: localStorage.getItem('accessToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
    if (user) localStorage.setItem('user', JSON.stringify(user))
    set({ user, accessToken, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    useCharacterStore.getState().clearCharacter()
    set({ user: null, accessToken: null, isAuthenticated: false })
  },

  setAccessToken: (accessToken) => {
    localStorage.setItem('accessToken', accessToken)
    set({ accessToken })
  },

  setUser: (user) => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },
}))

export default useAuthStore
```

- [ ] **Step 2: `LoginPage.jsx` — OAuth2 콜백 useEffect 수정**

기존 useEffect 블록 교체:

```js
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  const refresh = params.get('refresh')
  const isNew = params.get('isNew') === 'true'
  const role = params.get('role') || 'USER'
  if (token) {
    login({ role }, token, refresh)
    if (role === 'ADMIN') {
      navigate('/admin', { replace: true })
    } else {
      navigate(isNew ? '/character/create' : '/game', { replace: true })
    }
  }
}, [])
```

- [ ] **Step 3: `LoginPage.jsx` — handleSubmit 로그인 분기 수정**

기존 login 모드 처리 부분 교체:

```js
const { accessToken, refreshToken, userId, nickname, newUser, role } = data.data
login({ userId, nickname, role }, accessToken, refreshToken)
if (role === 'ADMIN') {
  navigate('/admin', { replace: true })
} else {
  navigate(newUser ? '/character/create' : '/game', { replace: true })
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/store/authStore.js frontend/src/pages/auth/LoginPage.jsx
git commit -m "feat: authStore role 저장 + 로그인 후 ADMIN/USER 분기"
```

---

## Task 13: 프론트엔드 — AdminRoute + App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: `App.jsx` 전체 교체**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import useAuthStore from '@/store/authStore'
import LoginPage from '@/pages/auth/LoginPage'
import GamePage from '@/pages/GamePage'

const CharacterCreatePage = lazy(() => import('@/pages/character/CharacterCreatePage'))
const BattlePage = lazy(() => import('@/pages/game/BattlePage'))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminQuestions = lazy(() => import('@/pages/admin/AdminQuestions'))
const AdminMonsters = lazy(() => import('@/pages/admin/AdminMonsters'))
const AdminItems = lazy(() => import('@/pages/admin/AdminItems'))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminRankings = lazy(() => import('@/pages/admin/AdminRankings'))

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/character/create" element={<PrivateRoute><CharacterCreatePage /></PrivateRoute>} />
          <Route path="/battle" element={<PrivateRoute><BattlePage /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/questions" element={<AdminRoute><AdminQuestions /></AdminRoute>} />
          <Route path="/admin/monsters" element={<AdminRoute><AdminMonsters /></AdminRoute>} />
          <Route path="/admin/items" element={<AdminRoute><AdminItems /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/rankings" element={<AdminRoute><AdminRankings /></AdminRoute>} />
          <Route path="/*" element={<PrivateRoute><GamePage /></PrivateRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: AdminRoute 가드 + /admin/** 라우트 추가"
```

---

## Task 14: 프론트엔드 — AdminLayout + adminApi

**Files:**
- Create: `frontend/src/api/adminApi.js`
- Create: `frontend/src/components/admin/AdminLayout.jsx`
- Create: `frontend/src/components/admin/AdminLayout.css`

- [ ] **Step 1: `adminApi.js` 작성**

```js
import api from './axios'

export const getQuestions = (page = 0) => api.get(`/admin/questions?page=${page}&size=20`)
export const createQuestion = (data) => api.post('/admin/questions', data)
export const updateQuestion = (id, data) => api.put(`/admin/questions/${id}`, data)
export const deleteQuestion = (id) => api.delete(`/admin/questions/${id}`)

export const getMonsters = (page = 0) => api.get(`/admin/monsters?page=${page}&size=20`)
export const createMonster = (data) => api.post('/admin/monsters', data)
export const updateMonster = (id, data) => api.put(`/admin/monsters/${id}`, data)
export const deleteMonster = (id) => api.delete(`/admin/monsters/${id}`)

export const getItems = (page = 0) => api.get(`/admin/items?page=${page}&size=20`)
export const createItem = (data) => api.post('/admin/items', data)
export const updateItem = (id, data) => api.put(`/admin/items/${id}`, data)
export const deleteItem = (id) => api.delete(`/admin/items/${id}`)

export const getCosmetics = (page = 0) => api.get(`/admin/cosmetics?page=${page}&size=20`)
export const createCosmetic = (data) => api.post('/admin/cosmetics', data)
export const updateCosmetic = (id, data) => api.put(`/admin/cosmetics/${id}`, data)
export const deleteCosmetic = (id) => api.delete(`/admin/cosmetics/${id}`)

export const getUsers = (page = 0) => api.get(`/admin/users?page=${page}&size=20`)
export const toggleUserStatus = (id) => api.patch(`/admin/users/${id}/status`)

export const getGlobalRanking = () => api.get('/admin/rankings/global')
export const getWeeklyRanking = () => api.get('/admin/rankings/weekly')
export const clearWeeklyRanking = () => api.delete('/admin/rankings/weekly')
```

- [ ] **Step 2: `AdminLayout.jsx` 작성**

```jsx
import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import './AdminLayout.css'

const NAV_ITEMS = [
  { path: '/admin', label: '대시보드', exact: true },
  { path: '/admin/questions', label: '문제 관리' },
  { path: '/admin/monsters', label: '몬스터 관리' },
  { path: '/admin/items', label: '아이템 관리' },
  { path: '/admin/users', label: '회원 관리' },
  { path: '/admin/rankings', label: '랭킹 관리' },
]

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <div className="admin-logo">⚔️ HeroTalk Admin</div>
        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="admin-logout" onClick={handleLogout}>로그아웃</button>
      </aside>
      <main className="admin-content">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: `AdminLayout.css` 작성**

```css
.admin-root {
  display: flex;
  min-height: 100vh;
  background: #0f0f1a;
  color: #e2e8f0;
  font-family: 'Inter', sans-serif;
}
.admin-sidebar {
  width: 220px;
  min-height: 100vh;
  background: #1a1a2e;
  border-right: 1px solid #2d2d4e;
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  position: fixed;
}
.admin-logo {
  font-size: 16px;
  font-weight: 700;
  color: #a78bfa;
  padding: 0 20px 24px;
  border-bottom: 1px solid #2d2d4e;
  margin-bottom: 16px;
}
.admin-nav { display: flex; flex-direction: column; flex: 1; }
.admin-nav-item {
  padding: 10px 20px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.15s;
}
.admin-nav-item:hover, .admin-nav-item.active {
  background: #2d2d4e;
  color: #a78bfa;
}
.admin-logout {
  margin: 16px;
  padding: 8px;
  background: #3d1a1a;
  color: #f87171;
  border: 1px solid #7f1d1d;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.admin-logout:hover { background: #5a2020; }
.admin-content { margin-left: 220px; flex: 1; padding: 32px; }
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api/adminApi.js frontend/src/components/admin/
git commit -m "feat: adminApi + AdminLayout 컴포넌트 구현"
```

---

## Task 15: 프론트엔드 — 어드민 페이지 구현

**Files:**
- Create: `frontend/src/pages/admin/AdminDashboard.jsx`
- Create: `frontend/src/pages/admin/AdminQuestions.jsx`
- Create: `frontend/src/pages/admin/AdminMonsters.jsx`
- Create: `frontend/src/pages/admin/AdminItems.jsx`
- Create: `frontend/src/pages/admin/AdminUsers.jsx`
- Create: `frontend/src/pages/admin/AdminRankings.jsx`

공통 스타일 변수 (각 파일에서 정의):

```js
const btnS = (bg, color) => ({
  padding: '6px 14px', background: bg, color, border: 'none',
  borderRadius: 6, cursor: 'pointer', fontSize: 13,
})
const inputS = {
  width: '100%', padding: '8px 12px', background: '#0f0f1a',
  border: '1px solid #2d2d4e', borderRadius: 6, color: '#e2e8f0',
  fontSize: 14, boxSizing: 'border-box',
}
const tableS = { width: '100%', borderCollapse: 'collapse', background: '#1a1a2e', borderRadius: 8 }
const thS = { padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: 13 }
const tdS = { padding: '10px 16px', fontSize: 14 }
const overlayS = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
}
const modalS = {
  background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12,
  padding: 24, width: 480, display: 'flex', flexDirection: 'column', gap: 10,
}
```

- [ ] **Step 1: `AdminDashboard.jsx` 작성**

```jsx
import { Link } from 'react-router-dom'
import AdminLayout from '@/components/admin/AdminLayout'

const CARDS = [
  { path: '/admin/questions', label: '문제 관리', icon: '📝' },
  { path: '/admin/monsters', label: '몬스터 관리', icon: '👹' },
  { path: '/admin/items', label: '아이템 관리', icon: '🛡️' },
  { path: '/admin/users', label: '회원 관리', icon: '👤' },
  { path: '/admin/rankings', label: '랭킹 관리', icon: '🏆' },
]

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>대시보드</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {CARDS.map((card) => (
          <Link key={card.path} to={card.path}
            style={{
              background: '#1a1a2e', border: '1px solid #2d2d4e',
              borderRadius: 12, padding: 24, textDecoration: 'none',
              color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 12,
              fontSize: 16, fontWeight: 600,
            }}>
            <span style={{ fontSize: 32 }}>{card.icon}</span>
            {card.label}
          </Link>
        ))}
      </div>
    </AdminLayout>
  )
}
```

- [ ] **Step 2: `AdminQuestions.jsx` 작성**

```jsx
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '@/api/adminApi'

const PARTS = ['PART1', 'PART2', 'PART3', 'PART4', 'PART5', 'PART6']
const EMPTY = { toeicPart: 'PART2', difficulty: 1, questionText: '', imageUrl: '', contextData: '', prepTime: 30, answerTime: 45, sampleAnswer: '', hint: '' }
const btnS = (bg, color) => ({ padding: '6px 14px', background: bg, color, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 })
const inputS = { width: '100%', padding: '8px 12px', background: '#0f0f1a', border: '1px solid #2d2d4e', borderRadius: 6, color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box' }

export default function AdminQuestions() {
  const [data, setData] = useState({ content: [], totalPages: 0 })
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const res = await getQuestions(page)
    setData(res.data.data)
  }, [page])

  useEffect(() => { load() }, [load])

  const f = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  const fn = (field) => (e) => setForm((prev) => ({ ...prev, [field]: +e.target.value }))

  const handleSave = async () => {
    setLoading(true)
    try {
      if (modal === 'create') await createQuestion(form)
      else await updateQuestion(modal.id, form)
      setModal(null); load()
    } finally { setLoading(false) }
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>문제 관리</h1>
        <button onClick={() => { setForm(EMPTY); setModal('create') }} style={btnS('#4c1d95', '#a78bfa')}>+ 문제 추가</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1a1a2e', borderRadius: 8 }}>
        <thead><tr style={{ background: '#16162a' }}>
          {['ID', '파트', '난이도', '문제 텍스트', '작업'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: 13 }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {data.content.map(q => (
            <tr key={q.id} style={{ borderBottom: '1px solid #2d2d4e' }}>
              <td style={{ padding: '10px 16px' }}>{q.id}</td>
              <td style={{ padding: '10px 16px' }}>{q.toeicPart}</td>
              <td style={{ padding: '10px 16px' }}>{q.difficulty}</td>
              <td style={{ padding: '10px 16px', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.questionText}</td>
              <td style={{ padding: '10px 16px' }}>
                <button onClick={() => { setForm({ ...q }); setModal({ id: q.id }) }} style={btnS('#1e3a5f', '#60a5fa')}>수정</button>
                {' '}
                <button onClick={async () => { if (confirm('삭제?')) { await deleteQuestion(q.id); load() } }} style={btnS('#3d1a1a', '#f87171')}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
        {Array.from({ length: data.totalPages }, (_, i) => (
          <button key={i} onClick={() => setPage(i)} style={btnS(i === page ? '#4c1d95' : '#1a1a2e', i === page ? '#a78bfa' : '#94a3b8')}>{i + 1}</button>
        ))}
      </div>
      {modal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12, padding: 24, width: 480, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ marginBottom: 8 }}>{modal === 'create' ? '문제 추가' : '문제 수정'}</h2>
            <select value={form.toeicPart} onChange={f('toeicPart')} style={inputS}>{PARTS.map(p => <option key={p}>{p}</option>)}</select>
            <input type="number" placeholder="난이도 (1-5)" value={form.difficulty} onChange={fn('difficulty')} style={inputS} />
            <textarea placeholder="문제 텍스트" value={form.questionText} onChange={f('questionText')} style={{ ...inputS, height: 80, resize: 'vertical' }} />
            <input placeholder="힌트" value={form.hint} onChange={f('hint')} style={inputS} />
            <input placeholder="샘플 답변" value={form.sampleAnswer} onChange={f('sampleAnswer')} style={inputS} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" placeholder="준비 시간(초)" value={form.prepTime} onChange={fn('prepTime')} style={inputS} />
              <input type="number" placeholder="답변 시간(초)" value={form.answerTime} onChange={fn('answerTime')} style={inputS} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => setModal(null)} style={btnS('#2d2d4e', '#94a3b8')}>취소</button>
              <button onClick={handleSave} disabled={loading} style={btnS('#4c1d95', '#a78bfa')}>{loading ? '저장 중...' : '저장'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
```

- [ ] **Step 3: `AdminMonsters.jsx` 작성**

동일 패턴으로 구현. 주요 차이점:
- 컬럼: ID, 이름, 타입, HP, 공격력, EXP, 골드, 파트
- 폼 필드: dungeonId(number), name, monsterType(select: NORMAL/BOSS/WEEKLY_BOSS), hp, attackPower, expReward, goldReward, toeicPart(select), difficulty
- `useCallback`으로 load 함수 감싸기

```jsx
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getMonsters, createMonster, updateMonster, deleteMonster } from '@/api/adminApi'

const MONSTER_TYPES = ['NORMAL', 'BOSS', 'WEEKLY_BOSS']
const PARTS = ['PART1', 'PART2', 'PART3', 'PART4', 'PART5', 'PART6']
const EMPTY = { dungeonId: 1, name: '', monsterType: 'NORMAL', hp: 200, attackPower: 10, expReward: 100, goldReward: 15, toeicPart: 'PART2', difficulty: 1 }
const btnS = (bg, color) => ({ padding: '6px 14px', background: bg, color, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 })
const inputS = { width: '100%', padding: '8px 12px', background: '#0f0f1a', border: '1px solid #2d2d4e', borderRadius: 6, color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box' }

export default function AdminMonsters() {
  const [data, setData] = useState({ content: [], totalPages: 0 })
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const res = await getMonsters(page); setData(res.data.data)
  }, [page])
  useEffect(() => { load() }, [load])

  const f = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))
  const fn = (field) => (e) => setForm((p) => ({ ...p, [field]: +e.target.value }))

  const handleSave = async () => {
    setLoading(true)
    try {
      if (modal === 'create') await createMonster(form)
      else await updateMonster(modal.id, form)
      setModal(null); load()
    } finally { setLoading(false) }
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>몬스터 관리</h1>
        <button onClick={() => { setForm(EMPTY); setModal('create') }} style={btnS('#4c1d95', '#a78bfa')}>+ 몬스터 추가</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1a1a2e', borderRadius: 8 }}>
        <thead><tr style={{ background: '#16162a' }}>
          {['ID','이름','타입','HP','공격력','EXP','골드','파트','작업'].map(h => <th key={h} style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: 13 }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {data.content.map(m => (
            <tr key={m.id} style={{ borderBottom: '1px solid #2d2d4e' }}>
              {[m.id, m.name, m.monsterType, m.hp, m.attackPower, m.expReward, m.goldReward, m.toeicPart].map((v, i) => (
                <td key={i} style={{ padding: '10px 12px' }}>{v}</td>
              ))}
              <td style={{ padding: '10px 12px' }}>
                <button onClick={() => { setForm({ ...m, dungeonId: m.dungeon?.id || 1 }); setModal({ id: m.id }) }} style={btnS('#1e3a5f', '#60a5fa')}>수정</button>
                {' '}
                <button onClick={async () => { if (confirm('삭제?')) { await deleteMonster(m.id); load() } }} style={btnS('#3d1a1a', '#f87171')}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {modal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12, padding: 24, width: 480, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ marginBottom: 8 }}>{modal === 'create' ? '몬스터 추가' : '몬스터 수정'}</h2>
            <input type="number" placeholder="던전 ID" value={form.dungeonId} onChange={fn('dungeonId')} style={inputS} />
            <input placeholder="이름" value={form.name} onChange={f('name')} style={inputS} />
            <select value={form.monsterType} onChange={f('monsterType')} style={inputS}>{MONSTER_TYPES.map(t => <option key={t}>{t}</option>)}</select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['hp','HP'],['attackPower','공격력'],['expReward','EXP'],['goldReward','골드'],['difficulty','난이도']].map(([k, ph]) => (
                <input key={k} type="number" placeholder={ph} value={form[k]} onChange={fn(k)} style={{ padding: '8px 12px', background: '#0f0f1a', border: '1px solid #2d2d4e', borderRadius: 6, color: '#e2e8f0' }} />
              ))}
              <select value={form.toeicPart} onChange={f('toeicPart')} style={{ padding: '8px 12px', background: '#0f0f1a', border: '1px solid #2d2d4e', borderRadius: 6, color: '#e2e8f0' }}>
                {PARTS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => setModal(null)} style={btnS('#2d2d4e', '#94a3b8')}>취소</button>
              <button onClick={handleSave} disabled={loading} style={btnS('#4c1d95', '#a78bfa')}>{loading ? '저장 중...' : '저장'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
```

- [ ] **Step 4: `AdminItems.jsx` 작성**

아이템과 코스튬을 탭으로 구분:

```jsx
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getItems, createItem, updateItem, deleteItem, getCosmetics, createCosmetic, updateCosmetic, deleteCosmetic } from '@/api/adminApi'

const ITEM_TYPES = ['HP_POTION', 'XP_BOOSTER', 'TIME_EXTEND', 'RETRY', 'HINT_BOOST']
const COSMETIC_TYPES = ['COSTUME', 'WEAPON']
const RARITIES = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY']
const ITEM_EMPTY = { name: '', description: '', itemType: 'HP_POTION', effectValue: 0, price: 0 }
const COSMETIC_EMPTY = { name: '', cosmeticType: 'COSTUME', description: '', imageUrl: '', price: 0, rarity: 'COMMON' }
const btnS = (bg, color) => ({ padding: '6px 14px', background: bg, color, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 })
const inputS = { width: '100%', padding: '8px 12px', background: '#0f0f1a', border: '1px solid #2d2d4e', borderRadius: 6, color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box' }

export default function AdminItems() {
  const [tab, setTab] = useState('items')
  const [items, setItems] = useState({ content: [] })
  const [cosmetics, setCosmetics] = useState({ content: [] })
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)

  const loadItems = useCallback(async () => { const r = await getItems(); setItems(r.data.data) }, [])
  const loadCosmetics = useCallback(async () => { const r = await getCosmetics(); setCosmetics(r.data.data) }, [])

  useEffect(() => { loadItems(); loadCosmetics() }, [loadItems, loadCosmetics])

  const f = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))
  const fn = (field) => (e) => setForm((p) => ({ ...p, [field]: +e.target.value }))

  const handleSave = async () => {
    setLoading(true)
    try {
      if (tab === 'items') {
        if (modal === 'create') await createItem(form); else await updateItem(modal.id, form)
        loadItems()
      } else {
        if (modal === 'create') await createCosmetic(form); else await updateCosmetic(modal.id, form)
        loadCosmetics()
      }
      setModal(null)
    } finally { setLoading(false) }
  }

  const isItems = tab === 'items'
  const rows = isItems ? items.content : cosmetics.content

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>아이템 관리</h1>
        <button onClick={() => { setForm(isItems ? ITEM_EMPTY : COSMETIC_EMPTY); setModal('create') }} style={btnS('#4c1d95', '#a78bfa')}>+ 추가</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab('items')} style={btnS(isItems ? '#4c1d95' : '#1a1a2e', isItems ? '#a78bfa' : '#94a3b8')}>아이템</button>
        <button onClick={() => setTab('cosmetics')} style={btnS(!isItems ? '#4c1d95' : '#1a1a2e', !isItems ? '#a78bfa' : '#94a3b8')}>코스튬</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1a1a2e', borderRadius: 8 }}>
        <thead><tr style={{ background: '#16162a' }}>
          {(isItems ? ['ID','이름','타입','효과값','가격'] : ['ID','이름','타입','희귀도','가격']).concat(['작업']).map(h => (
            <th key={h} style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: 13 }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} style={{ borderBottom: '1px solid #2d2d4e' }}>
              <td style={{ padding: '10px 12px' }}>{row.id}</td>
              <td style={{ padding: '10px 12px' }}>{row.name}</td>
              <td style={{ padding: '10px 12px' }}>{isItems ? row.itemType : row.cosmeticType}</td>
              <td style={{ padding: '10px 12px' }}>{isItems ? row.effectValue : row.rarity}</td>
              <td style={{ padding: '10px 12px' }}>{row.price}</td>
              <td style={{ padding: '10px 12px' }}>
                <button onClick={() => { setForm({ ...row }); setModal({ id: row.id }) }} style={btnS('#1e3a5f', '#60a5fa')}>수정</button>
                {' '}
                <button onClick={async () => { if (confirm('삭제?')) { isItems ? await deleteItem(row.id) : await deleteCosmetic(row.id); isItems ? loadItems() : loadCosmetics() } }} style={btnS('#3d1a1a', '#f87171')}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {modal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12, padding: 24, width: 440, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ marginBottom: 8 }}>{modal === 'create' ? '추가' : '수정'}</h2>
            <input placeholder="이름" value={form.name || ''} onChange={f('name')} style={inputS} />
            {isItems ? (
              <>
                <select value={form.itemType || 'HP_POTION'} onChange={f('itemType')} style={inputS}>{ITEM_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                <input type="number" placeholder="효과값" value={form.effectValue || 0} onChange={fn('effectValue')} style={inputS} />
              </>
            ) : (
              <>
                <select value={form.cosmeticType || 'COSTUME'} onChange={f('cosmeticType')} style={inputS}>{COSMETIC_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                <select value={form.rarity || 'COMMON'} onChange={f('rarity')} style={inputS}>{RARITIES.map(r => <option key={r}>{r}</option>)}</select>
              </>
            )}
            <input type="number" placeholder="가격" value={form.price || 0} onChange={fn('price')} style={inputS} />
            <input placeholder="설명" value={form.description || ''} onChange={f('description')} style={inputS} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => setModal(null)} style={btnS('#2d2d4e', '#94a3b8')}>취소</button>
              <button onClick={handleSave} disabled={loading} style={btnS('#4c1d95', '#a78bfa')}>{loading ? '저장 중...' : '저장'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
```

- [ ] **Step 5: `AdminUsers.jsx` 작성**

```jsx
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getUsers, toggleUserStatus } from '@/api/adminApi'

const btnS = (bg, color) => ({ padding: '6px 14px', background: bg, color, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 })

export default function AdminUsers() {
  const [data, setData] = useState({ content: [], totalPages: 0 })
  const [page, setPage] = useState(0)

  const load = useCallback(async () => {
    const r = await getUsers(page); setData(r.data.data)
  }, [page])
  useEffect(() => { load() }, [load])

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>회원 관리</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1a1a2e', borderRadius: 8 }}>
        <thead><tr style={{ background: '#16162a' }}>
          {['ID', '이메일', '닉네임', '역할', '프로바이더', '상태', '작업'].map(h => (
            <th key={h} style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: 13 }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {data.content.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid #2d2d4e' }}>
              <td style={{ padding: '10px 12px' }}>{u.id}</td>
              <td style={{ padding: '10px 12px' }}>{u.email}</td>
              <td style={{ padding: '10px 12px' }}>{u.nickname}</td>
              <td style={{ padding: '10px 12px' }}><span style={{ color: u.role === 'ADMIN' ? '#a78bfa' : '#94a3b8' }}>{u.role}</span></td>
              <td style={{ padding: '10px 12px' }}>{u.provider}</td>
              <td style={{ padding: '10px 12px' }}><span style={{ color: u.active ? '#34d399' : '#f87171' }}>{u.active ? '활성' : '비활성'}</span></td>
              <td style={{ padding: '10px 12px' }}>
                {u.role !== 'ADMIN' && (
                  <button onClick={async () => { await toggleUserStatus(u.id); load() }}
                    style={btnS(u.active ? '#3d1a1a' : '#1a3d1a', u.active ? '#f87171' : '#34d399')}>
                    {u.active ? '비활성화' : '활성화'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
        {Array.from({ length: data.totalPages }, (_, i) => (
          <button key={i} onClick={() => setPage(i)} style={btnS(i === page ? '#4c1d95' : '#1a1a2e', i === page ? '#a78bfa' : '#94a3b8')}>{i + 1}</button>
        ))}
      </div>
    </AdminLayout>
  )
}
```

- [ ] **Step 6: `AdminRankings.jsx` 작성**

```jsx
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getGlobalRanking, getWeeklyRanking, clearWeeklyRanking } from '@/api/adminApi'

const btnS = (bg, color) => ({ padding: '6px 14px', background: bg, color, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 })

export default function AdminRankings() {
  const [tab, setTab] = useState('global')
  const [global, setGlobal] = useState([])
  const [weekly, setWeekly] = useState([])

  const loadAll = async () => {
    const [g, w] = await Promise.all([getGlobalRanking(), getWeeklyRanking()])
    setGlobal(g.data.data || [])
    setWeekly(w.data.data || [])
  }

  useEffect(() => { loadAll() }, [])

  const handleClear = async () => {
    if (!confirm('주간 랭킹을 초기화하시겠습니까?')) return
    await clearWeeklyRanking()
    loadAll()
  }

  const data = tab === 'global' ? global : weekly

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>랭킹 관리</h1>
        {tab === 'weekly' && <button onClick={handleClear} style={btnS('#3d1a1a', '#f87171')}>주간 랭킹 초기화</button>}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['global', '글로벌'], ['weekly', '주간']].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)} style={btnS(tab === val ? '#4c1d95' : '#1a1a2e', tab === val ? '#a78bfa' : '#94a3b8')}>{label}</button>
        ))}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1a1a2e', borderRadius: 8 }}>
        <thead><tr style={{ background: '#16162a' }}>
          {['순위', '캐릭터명', '직업', '레벨', '점수'].map(h => <th key={h} style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: 13 }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {data.map(r => (
            <tr key={r.userId} style={{ borderBottom: '1px solid #2d2d4e' }}>
              <td style={{ padding: '10px 12px', fontWeight: r.rank <= 3 ? 700 : 400, color: r.rank === 1 ? '#fbbf24' : r.rank === 2 ? '#94a3b8' : r.rank === 3 ? '#b45309' : '#e2e8f0' }}>{r.rank}</td>
              <td style={{ padding: '10px 12px' }}>{r.characterName}</td>
              <td style={{ padding: '10px 12px' }}>{r.job}</td>
              <td style={{ padding: '10px 12px' }}>{r.level}</td>
              <td style={{ padding: '10px 12px' }}>{r.score?.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  )
}
```

- [ ] **Step 7: 프론트 빌드 확인**

```bash
cd /Users/hyeonseung/Desktop/HeroTalk/frontend
npm run build
```
Expected: 빌드 오류 없음

- [ ] **Step 8: Commit**

```bash
cd /Users/hyeonseung/Desktop/HeroTalk
git add frontend/src/pages/admin/
git commit -m "feat: 어드민 페이지 전체 구현 (대시보드/문제/몬스터/아이템/회원/랭킹)"
```

---

## Task 16: 최종 검증

- [ ] **Step 1: 전체 백엔드 테스트**

```bash
cd /Users/hyeonseung/Desktop/HeroTalk
./gradlew test
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 2: 수동 확인 체크리스트**

```
□ admin@herotalk.com 로그인 → /admin 자동 이동
□ 사이드바 모든 메뉴 클릭 정상 작동
□ 문제 추가 → 저장 → 목록 표시
□ 몬스터 추가 → 저장 → 목록 표시
□ 아이템/코스튬 탭 전환 + CRUD
□ 회원 목록 조회 + ADMIN 계정 비활성화 버튼 없음 확인
□ 주간 랭킹 초기화 버튼 동작
□ 일반 유저 로그인 → /admin 접근 시 / 리다이렉트
□ 비활성화된 계정으로 로그인 시 실패
```

- [ ] **Step 3: 최종 Commit**

```bash
git add docs/
git commit -m "feat: 어드민 시스템 구현 완료 — Role 기반 권한, 독립 대시보드, CRUD API"
```
