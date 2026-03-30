# HeroTalk 어드민 시스템 설계

**날짜:** 2026-03-30
**상태:** 확정 (스펙 리뷰 2회 반영)

---

## 개요

HeroTalk에 ADMIN 역할 기반 독립 대시보드를 추가한다. 어드민은 일반 유저 게임 기능도 사용 가능하며 (Role Hierarchy), `/admin` 경로에서 콘텐츠 및 회원을 관리한다.

---

## 아키텍처

기존 Spring Boot 백엔드에 `/api/admin/**` 엔드포인트 추가, 기존 React 프론트에 `/admin` 라우트 추가. 별도 서버 없이 현재 스택 그대로 확장.

---

## 백엔드

### 1. User 엔티티 수정

```java
@Enumerated(EnumType.STRING)
@Column(name = "role", nullable = false)
@Builder.Default
private Role role = Role.USER;

public enum Role { USER, ADMIN }
```

### 2. CustomUserDetails / CustomUserDetailsService 수정

**반드시 User 엔티티 수정과 함께 3파일 동시 변경.**

```java
// CustomUserDetails — 생성자에 Role 추가
public CustomUserDetails(Long userId, String email, String password, User.Role role) {
    this.userId = userId;
    this.email = email;
    this.password = password;
    this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
}

// isEnabled — isActive 연결 (비활성화 계정 로그인 차단)
public boolean isEnabled() {
    return isActive;
}

// CustomUserDetailsService — role 전달
return new CustomUserDetails(user.getId(), user.getEmail(), user.getPassword(), user.getRole());
```

권한은 JWT 클레임이 아닌 **DB 값 기반**으로 결정. JWT에 role 클레임 추가 불필요.

### 3. SecurityConfig 수정

```java
// Role Hierarchy: ADMIN이 USER 권한 포함
@Bean
RoleHierarchy roleHierarchy() {
    return RoleHierarchyImpl.withDefaultRolePrefix()
        .role("ADMIN").implies("USER")
        .build();
}

// 경로 권한
/api/admin/** → hasRole("ADMIN")
/api/**       → hasRole("USER")
```

### 4. AuthResponse에 role 추가

```java
// AuthResponse.java
private String role;  // 추가

// AuthService — role 포함 반환
.role(user.getRole().name())

// OAuth2SuccessHandler — 리디렉션 쿼리 파라미터에 role 포함
// ?token=xxx&refresh=xxx&isNew=xxx&role=ADMIN
// (URL 노출이지만 role은 민감 정보가 아님, 실제 권한은 서버에서 DB 기반으로 검증)
```

### 5. DataInitializer 수정

어드민 계정 생성은 던전 시드 데이터 조기 반환 **이전**에 실행.

```java
@Override
public void run(String... args) {
    // 1. 어드민 계정 생성 (항상 먼저 실행, 독립 조건)
    if (userRepository.findByEmail("admin@herotalk.com").isEmpty()) {
        String adminPassword = environment.getProperty("ADMIN_PASSWORD");
        if (adminPassword == null || adminPassword.isBlank()) {
            throw new IllegalStateException("ADMIN_PASSWORD 환경변수가 설정되지 않았습니다. 서버를 시작할 수 없습니다.");
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
    }

    // 2. 던전 시드 데이터 (기존 조기 반환 유지)
    if (dungeonRepository.count() > 0) {
        return;
    }
    // ... 기존 시드 데이터
}
```

`ADMIN_PASSWORD` 미설정 시 `IllegalStateException` 발생 → 서버 기동 실패.

### 6. Admin API 엔드포인트

모든 경로 `/api/admin/**`, ADMIN 역할 필요.
패키지: `domain/admin/controller/`

| 기능 | 메서드 | 경로 |
|---|---|---|
| 문제 목록 | GET | `/questions` |
| 문제 생성 | POST | `/questions` |
| 문제 수정 | PUT | `/questions/{id}` |
| 문제 삭제 | DELETE | `/questions/{id}` |
| 몬스터 목록 | GET | `/monsters` |
| 몬스터 생성 | POST | `/monsters` |
| 몬스터 수정 | PUT | `/monsters/{id}` |
| 몬스터 삭제 | DELETE | `/monsters/{id}` |
| 아이템 목록 | GET | `/items` |
| 아이템 생성 | POST | `/items` |
| 아이템 수정 | PUT | `/items/{id}` |
| 아이템 삭제 | DELETE | `/items/{id}` |
| 코스튬 목록 | GET | `/cosmetics` |
| 코스튬 생성 | POST | `/cosmetics` |
| 코스튬 수정 | PUT | `/cosmetics/{id}` |
| 코스튬 삭제 | DELETE | `/cosmetics/{id}` |
| 회원 목록 | GET | `/users` |
| 회원 활성/비활성 | PATCH | `/users/{id}/status` |
| 글로벌 랭킹 조회 | GET | `/rankings/global` |
| 주간 랭킹 조회 | GET | `/rankings/weekly` |
| 주간 랭킹 초기화 | DELETE | `/rankings/weekly` |

> **어드민 계정 생성 API 없음.** DataInitializer를 통해서만 생성.

### 7. 새 환경변수

```
ADMIN_PASSWORD  → 초기 어드민 비밀번호 (필수, 미설정 시 기동 실패)
```

---

## 프론트엔드

### 1. authStore 수정

로그인 응답의 `role` 저장. 로그인 후 분기:
- `ADMIN` → `/admin`
- `USER` → `/`

OAuth2 로그인: 리디렉션 URL의 `role` 쿼리 파라미터 파싱하여 저장.

### 2. AdminRoute 가드

```jsx
function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" />
  if (user?.role !== 'ADMIN') return <Navigate to="/" />
  return children
}
```

### 3. 라우트 구조

```
/admin                → AdminDashboard
/admin/questions      → 문제 관리
/admin/monsters       → 몬스터 관리
/admin/items          → 아이템/코스튬 관리
/admin/users          → 회원 관리
/admin/rankings       → 랭킹 관리
```

### 4. UI 구성

- 좌측 고정 사이드바 + 우측 콘텐츠 영역
- 심플한 다크 테마 (게임 Phaser 씬과 무관)
- 각 페이지: 데이터 테이블 + 추가/수정 모달
- 공통 컴포넌트: `AdminLayout`, `AdminTable`, `AdminModal`

### 5. 파일 구조

```
frontend/src/
  pages/admin/
    AdminDashboard.jsx
    AdminQuestions.jsx
    AdminMonsters.jsx
    AdminItems.jsx
    AdminUsers.jsx
    AdminRankings.jsx
  components/admin/
    AdminLayout.jsx
    AdminTable.jsx
    AdminModal.jsx
  api/
    adminApi.js
```

---

## 데이터 흐름

```
어드민 로그인
  → JWT 토큰 발급
  → AuthResponse (role: "ADMIN" 포함)
  → authStore에 role 저장
  → /admin으로 리다이렉트
  → AdminRoute 가드 통과
  → adminApi 호출
  → /api/admin/**
  → JwtAuthenticationFilter → CustomUserDetailsService → DB role 조회
  → ROLE_ADMIN 확인
  → AdminXxxController 처리
```

---

## 구현 순서

1. **User 엔티티 Role 추가** — Role enum, 기본값 USER
2. **CustomUserDetails + CustomUserDetailsService 수정** — DB role → GrantedAuthority, isActive → isEnabled (3파일 동시)
3. **SecurityConfig 수정** — RoleHierarchy + /api/admin/** ADMIN 보호
4. **AuthResponse + AuthService + OAuth2SuccessHandler** — role 필드 추가
5. **DataInitializer 수정** — 어드민 생성 로직 최상단 배치, ADMIN_PASSWORD 검증
6. **Admin API 구현** — 문제 → 몬스터 → 아이템/코스튬 → 회원 → 랭킹
7. **프론트 authStore role 저장 + 로그인 분기**
8. **AdminRoute + /admin 라우트**
9. **어드민 페이지 구현** — AdminLayout → 각 관리 페이지

---

## 영향 범위

| 파일 | 변경 유형 |
|---|---|
| `User.java` | Role enum + 필드 추가 |
| `CustomUserDetails.java` | Role 파라미터, DB role → Authority, isActive → isEnabled |
| `CustomUserDetailsService.java` | role 전달 |
| `SecurityConfig.java` | RoleHierarchy + 경로 권한 |
| `AuthResponse.java` | role 필드 추가 |
| `AuthService.java` | role 포함 반환 |
| `OAuth2SuccessHandler.java` | role 쿼리 파라미터 추가 |
| `DataInitializer.java` | 어드민 생성 로직 최상단 배치 |
| `authStore.js` | role 저장 + 분기 |
| `App.jsx` | AdminRoute + /admin 라우트 |
