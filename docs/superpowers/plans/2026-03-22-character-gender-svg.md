# Character Gender + SVG Visual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 캐릭터 생성 페이지에 성별 선택(♂/♀)을 추가하고, hero.png 플레이스홀더를 직업×성별 인라인 SVG 캐릭터(8종)로 교체한다. 백엔드에 `gender` 필드를 추가하고 DB에 저장한다.

**Architecture:** 백엔드는 `Character` entity에 `Gender` enum + `gender` 컬럼을 추가하고, DTO/Service에 전파한다. 프론트는 `CharacterSvg.jsx`를 새로 만들어 8종 인라인 SVG를 렌더하고, `CharacterCreatePage.jsx`에 gender 상태와 토글 버튼을 추가한다.

**Tech Stack:** Java 17 / Spring Boot 3.2.5 / JPA (ddl-auto: update), React 18 / Vite / inline SVG

---

## File Map

| 파일 | 변경 유형 |
|---|---|
| `src/main/java/org/herotalk/domain/character/entity/Character.java` | 수정 — `Gender` enum + `gender` 필드 |
| `src/main/java/org/herotalk/domain/character/dto/CharacterCreateRequest.java` | 수정 — `gender` 필드 추가 |
| `src/main/java/org/herotalk/domain/character/dto/CharacterResponse.java` | 수정 — `gender` 필드 + `from()` 매핑 |
| `src/main/java/org/herotalk/domain/character/service/CharacterService.java` | 수정 — 빌더에 `.gender()` 추가 |
| `src/main/resources/application.yml` | 수정 — `ddl-auto: validate` → `update` |
| `frontend/src/components/CharacterSvg.jsx` | 신규 — 8종 SVG 컴포넌트 |
| `frontend/src/pages/character/CharacterCreatePage.jsx` | 수정 — gender 상태, 토글, CharacterSvg 연동 |
| `frontend/src/pages/character/CharacterCreatePage.css` | 수정 — gender toggle 스타일 추가 |
| `frontend/src/api/characterApi.js` | 수정 — `createCharacter`에 `gender` 파라미터 |

---

## Task 1: 백엔드 — Character entity에 Gender 추가

**Files:**
- Modify: `src/main/java/org/herotalk/domain/character/entity/Character.java`
- Modify: `src/main/resources/application.yml`

현재 `Character.java`에는 `Job` enum만 있고 `Gender`가 없다. `@Builder` 클래스이므로 필드 추가 후 빌더에서 자동으로 사용 가능.

- [ ] **Step 1: `Character.java`에 `Gender` enum + `gender` 필드 추가**

`Character.java` 의 `Job` enum 아래에 추가:
```java
public enum Gender { MALE, FEMALE }

@Enumerated(EnumType.STRING)
@Column(name = "gender", nullable = false)
private Gender gender;
```

- [ ] **Step 2: `application.yml`의 ddl-auto를 update로 변경**

```yaml
# 변경 전
ddl-auto: validate
# 변경 후
ddl-auto: update
```

- [ ] **Step 3: 컴파일 확인**

```bash
cd /Users/hyeonseung/Desktop/HeroTalk
./gradlew compileJava
```

Expected: BUILD SUCCESSFUL (컴파일 에러 없음)

- [ ] **Step 4: Commit**

```bash
git add src/main/java/org/herotalk/domain/character/entity/Character.java
git add src/main/resources/application.yml
git commit -m "feat: Character entity에 Gender enum + gender 필드 추가, ddl-auto update"
```

---

## Task 2: 백엔드 — DTO와 Service에 gender 전파

**Files:**
- Modify: `src/main/java/org/herotalk/domain/character/dto/CharacterCreateRequest.java`
- Modify: `src/main/java/org/herotalk/domain/character/dto/CharacterResponse.java`
- Modify: `src/main/java/org/herotalk/domain/character/service/CharacterService.java`

현재 DTO/Service에 gender가 없다. Task 1 완료 후 진행.

- [ ] **Step 1: `CharacterCreateRequest.java`에 `gender` 필드 추가**

현재 `name`, `job` 필드만 있는 파일에 추가:
```java
@NotNull(message = "성별은 필수입니다")
private Character.Gender gender;
```

- [ ] **Step 2: `CharacterResponse.java`에 `gender` 필드 추가**

`job` 필드 아래에 추가:
```java
private Character.Gender gender;
```

`from()` 메서드 빌더에 추가:
```java
.gender(character.getGender())
```

- [ ] **Step 3: `CharacterService.java` 빌더에 `.gender()` 추가**

`createCharacter` 메서드의 Character 빌더에:
```java
Character character = Character.builder()
        .user(user)
        .name(request.getName())
        .job(request.getJob())
        .gender(request.getGender())   // 추가
        .build();
```

- [ ] **Step 4: 컴파일 확인**

```bash
cd /Users/hyeonseung/Desktop/HeroTalk
./gradlew compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 5: Commit**

```bash
git add src/main/java/org/herotalk/domain/character/dto/CharacterCreateRequest.java
git add src/main/java/org/herotalk/domain/character/dto/CharacterResponse.java
git add src/main/java/org/herotalk/domain/character/service/CharacterService.java
git commit -m "feat: CharacterCreateRequest/Response에 gender 필드 추가, Service 저장 연동"
```

---

## Task 3: 프론트엔드 — CharacterSvg.jsx 8종 SVG 컴포넌트 구현

**Files:**
- Create: `frontend/src/components/CharacterSvg.jsx`

각 SVG는 동일한 레이어 구조(발그림자 → 망토/로브 → 몸통 → 머리 → 헤어 → 눈/입 → 다리 → 무기)를 가진다.

**8종 특징:**
| | WARRIOR | MAGE | KNIGHT | RANGER |
|---|---|---|---|---|
| MALE | 짧은 갈색 헤어, 파란 갑옷, 검 | 짧은 검정 헤어, 남색 로브, 마법 지팡이 | 은색 투구, 회색 중갑, 방패 | 짧은 갈색 헤어, 초록 의상, 활 |
| FEMALE | 긴 빨간 헤어, 보라 갑옷, 검 | 긴 금발 헤어, 보라 로브, 마법 지팡이 | 긴 흰 헤어, 은색 경갑, 방패 | 긴 갈색 헤어, 초록 의상, 활 |

- [ ] **Step 1: `CharacterSvg.jsx` 파일 생성**

`frontend/src/components/CharacterSvg.jsx` 생성:

```jsx
// SVG 8종을 job+gender 조합으로 렌더하는 컴포넌트
// viewBox: "0 0 60 90" — 모든 캐릭터 공통

export default function CharacterSvg({ job = 'WARRIOR', gender = 'MALE', width = 72, height = 96 }) {
  const key = `${job}_${gender}`
  const svgs = {
    WARRIOR_MALE: <WarriorMale />,
    WARRIOR_FEMALE: <WarriorFemale />,
    MAGE_MALE: <MageMale />,
    MAGE_FEMALE: <MageFemale />,
    KNIGHT_MALE: <KnightMale />,
    KNIGHT_FEMALE: <KnightFemale />,
    RANGER_MALE: <RangerMale />,
    RANGER_FEMALE: <RangerFemale />,
  }
  return (
    <svg width={width} height={height} viewBox="0 0 60 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      {svgs[key] ?? svgs['WARRIOR_MALE']}
    </svg>
  )
}
```

8개 내부 함수 컴포넌트 (SVG `<g>` 반환)를 각각 구현:

**공통 레이어 구조 (모든 캐릭터):**
1. 발그림자: `<ellipse cx="30" cy="85" rx="18" ry="3" fill="rgba(245,158,11,0.25)"/>`
2. 망토/로브 (직업별 색상)
3. 몸통 (직업별 색상)
4. 머리: `<circle cx="30" cy="22" r="11" fill="#f5c89a"/>`
5. 헤어 (성별·직업별 색상/형태)
6. 눈×2, 입: `<ellipse cx="26" cy="22" rx="2" ry="1.5" fill="#333"/>` 등
7. 다리 (직업별 색상)
8. 무기/장비

**WARRIOR_MALE 상세 (기준 SVG):**
```jsx
function WarriorMale() {
  return (
    <g>
      {/* 발그림자 */}
      <ellipse cx="30" cy="85" rx="18" ry="3" fill="rgba(245,158,11,0.25)"/>
      {/* 망토 */}
      <path d="M16 42 Q9 57 11 80 Q21 76 30 78 Q39 76 49 80 Q51 57 44 42 Z" fill="#1d4ed8" opacity="0.8"/>
      {/* 몸통 */}
      <rect x="20" y="40" width="20" height="26" rx="3" fill="#3b82f6"/>
      {/* 머리 */}
      <circle cx="30" cy="22" r="11" fill="#f5c89a"/>
      {/* 헤어 — 짧은 갈색 */}
      <path d="M19 18 Q19 9 30 9 Q41 9 41 18 L41 21 Q37 15 30 15 Q23 15 19 21 Z" fill="#5c3d1e"/>
      {/* 눈 */}
      <ellipse cx="26" cy="22" rx="2" ry="1.5" fill="#333"/>
      <ellipse cx="34" cy="22" rx="2" ry="1.5" fill="#333"/>
      {/* 입 */}
      <path d="M27 27 Q30 29 33 27" stroke="#c4856a" strokeWidth="1" fill="none"/>
      {/* 다리 */}
      <rect x="21" y="65" width="7" height="20" rx="3" fill="#1e3a8a"/>
      <rect x="32" y="65" width="7" height="20" rx="3" fill="#1e3a8a"/>
      {/* 검 */}
      <rect x="46" y="32" width="3" height="32" rx="1" fill="#94a3b8"/>
      <rect x="43" y="32" width="9" height="4" rx="1" fill="#cbd5e1"/>
    </g>
  )
}
```

**WARRIOR_FEMALE 상세:**
- 망토: `fill="#6d28d9"` (보라), 몸통: `fill="#7c3aed"`
- 헤어: 긴 빨간 헤어 (양옆으로 내려오는 path), `fill="#c0392b"`
- 다리: `fill="#5b21b6"`
- 검: 동일

**MAGE_MALE 상세:**
- 망토: `fill="#1e3a5f"`, 몸통: `fill="#1d4ed8"`
- 헤어: 짧은 검정, `fill="#1a1a1a"`
- 다리: `fill="#1e3a8a"`
- 무기: 지팡이 + 마법구 (`<circle>` + `fill="#a78bfa"`)

**MAGE_FEMALE 상세:**
- 망토: `fill="#4c1d95"`, 몸통: `fill="#7c3aed"`
- 헤어: 긴 금발, `fill="#f59e0b"`
- 무기: 지팡이 + 마법구

**KNIGHT_MALE 상세:**
- 망토: `fill="#374151"`, 몸통: `fill="#6b7280"`
- 헤어: 은색 투구 path, `fill="#9ca3af"`
- 방패: `<rect x="45" y="35" width="9" height="14" rx="2" fill="#94a3b8"/>`

**KNIGHT_FEMALE 상세:**
- 망토: `fill="#d1d5db"`, 몸통: `fill="#9ca3af"`
- 헤어: 긴 흰 헤어, `fill="#f9fafb"`
- 방패: 동일

**RANGER_MALE 상세:**
- 망토: `fill="#14532d"`, 몸통: `fill="#16a34a"`
- 헤어: 짧은 갈색, `fill="#5c3d1e"`
- 무기: 활 (`<path>` + 시위 line)

**RANGER_FEMALE 상세:**
- 망토: `fill="#14532d"`, 몸통: `fill="#15803d"`
- 헤어: 긴 갈색, `fill="#78350f"`
- 무기: 활 동일

- [ ] **Step 2: 브라우저에서 렌더 확인 (개발 서버 실행 후)**

```bash
cd /Users/hyeonseung/Desktop/HeroTalk/frontend
npm run dev
```

`/character/create` 페이지 열어서 SVG가 표시되는지 확인 (이 단계는 Task 4 완료 후 가능)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/CharacterSvg.jsx
git commit -m "feat: CharacterSvg 8종 SVG 캐릭터 컴포넌트 구현"
```

---

## Task 4: 프론트엔드 — CharacterCreatePage gender 연동 + CSS 추가

**Files:**
- Modify: `frontend/src/pages/character/CharacterCreatePage.jsx`
- Modify: `frontend/src/pages/character/CharacterCreatePage.css`
- Modify: `frontend/src/api/characterApi.js`

- [ ] **Step 1: `characterApi.js`에 `gender` 파라미터 추가**

현재:
```js
export async function createCharacter(name, job) {
  const response = await api.post('/characters', { name, job })
  return response.data.data
}
```

변경:
```js
export async function createCharacter(name, job, gender) {
  const response = await api.post('/characters', { name, job, gender })
  return response.data.data
}
```

- [ ] **Step 2: `CharacterCreatePage.jsx`에 gender 상태 + 토글 UI + CharacterSvg 연동**

상단 import에 추가:
```js
import CharacterSvg from '@/components/CharacterSvg'
```

`heroImg` import 제거 (더 이상 사용 안 함)

상태 추가 (`selectedJob` 아래):
```js
const [gender, setGender] = useState('MALE')
```

`handleSubmit`에서 `createCharacter` 호출 변경:
```js
await createCharacter(name.trim(), selectedJob, gender)
```

`cc-avatar` div 내부 `<img src={heroImg}>` 를 아래로 교체:
```jsx
<CharacterSvg
  job={selectedJob || 'WARRIOR'}
  gender={gender}
  width={80}
  height={96}
/>
```

`cc-avatar` div 아래, `cc-job-name` div 위에 성별 토글 추가:
```jsx
<div className="cc-gender-toggle">
  <button
    className={`cc-gender-btn ${gender === 'MALE' ? 'active' : ''}`}
    onClick={() => setGender('MALE')}
  >♂ 남성</button>
  <button
    className={`cc-gender-btn ${gender === 'FEMALE' ? 'active' : ''}`}
    onClick={() => setGender('FEMALE')}
  >♀ 여성</button>
</div>
```

- [ ] **Step 3: `CharacterCreatePage.css`에 gender toggle 스타일 추가**

`.cc-job-passive` 블록 아래에 추가:
```css
.cc-gender-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.cc-gender-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 5px 16px;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: sans-serif;
}
.cc-gender-btn.active {
  background: rgba(245, 158, 11, 0.2);
  border-color: #f59e0b;
  color: #f59e0b;
}
.cc-gender-btn:hover:not(.active) {
  border-color: rgba(245, 158, 11, 0.4);
  color: #aaa;
}
```

- [ ] **Step 4: `cc-avatar` CSS에서 img 크기 조정 확인**

현재 `.cc-avatar img`는 `width: 80px; height: 80px`. SVG는 `<img>`가 아니므로 아래를 추가:
```css
.cc-avatar svg {
  display: block;
}
```

- [ ] **Step 5: 브라우저에서 동작 확인**

확인 항목:
- 성별 토글 버튼 표시 및 클릭 시 활성 스타일 변경
- 직업 선택 + 성별 변경 시 SVG 즉시 교체
- 직업 미선택 시 기본 WARRIOR + 선택 성별 SVG 표시
- "모험 시작" 버튼 클릭 시 gender가 API 요청에 포함됨 (브라우저 Network 탭 확인)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/character/CharacterCreatePage.jsx
git add frontend/src/pages/character/CharacterCreatePage.css
git add frontend/src/api/characterApi.js
git commit -m "feat: CharacterCreatePage에 gender 토글 + SVG 캐릭터 연동"
```

---

## 완료 기준

- [ ] `Character` entity에 `Gender` enum + `gender` 컬럼 추가
- [ ] `CharacterCreateRequest`에 `gender` 필드 추가 (필수값 검증 포함)
- [ ] `CharacterResponse`에 `gender` 필드 추가 및 매핑
- [ ] `CharacterService`에서 `gender` 저장
- [ ] `ddl-auto: update`로 변경 (DB 컬럼 자동 생성)
- [ ] SVG 캐릭터 8종 구현 (`CharacterSvg.jsx`)
- [ ] 성별 토글 버튼 (왼쪽 프리뷰 패널, SVG 아래)
- [ ] 성별/직업 변경 시 SVG 즉시 교체
- [ ] `createCharacter` API에 `gender` 파라미터 전달
- [ ] 직업 미선택 시 기본 SVG (WARRIOR + 선택 성별) 표시
