# 캐릭터 생성 페이지 디자인 스펙

**날짜:** 2026-03-22
**단계:** 3단계 — 캐릭터 생성 프론트

---

## 개요

신규 유저가 로그인 직후 캐릭터 이름과 직업을 선택하는 단일 페이지.
기존 유저(이미 캐릭터 존재)는 이 페이지를 건너뛰고 마을로 바로 이동한다.

---

## 라우팅 & 분기 로직

### 로그인 후 분기
- **이메일 로그인**: `AuthResponse.newUser == true` → `/character/create`, `false` → `/game`
- **OAuth2 로그인**: 이미 `OAuth2SuccessHandler`가 `isNew` 쿼리 파라미터로 분기 처리 중
  - `LoginPage.jsx`에서 `params.get('isNew')` 읽어 라우팅
  - `authStore`에 별도 `newUser` 필드 추가 불필요

### 직접 접근 방어
- 이미 캐릭터가 있는 인증된 유저가 `/character/create`에 직접 접근하는 경우 처리 필요
- 전략: `CharacterCreatePage` 마운트 시 `GET /api/characters/me` 호출
  - 캐릭터 존재 → `/game`으로 리다이렉트
  - 캐릭터 없음 → 페이지 정상 렌더
  - API 호출 중: 로딩 스피너 표시 (빈 화면 방지)

---

## 레이아웃

풀스크린 다크판타지 테마 (로그인 페이지와 동일 톤).
좌우 분할 구조:

### 왼쪽 패널 — 캐릭터 미리보기

- 상단: "CHARACTER PREVIEW" 레이블
- 캐릭터 이미지: 원형 프레임 내 `hero.png` (현재 플레이스홀더, 추후 직업별 이미지로 교체 가능한 구조)
- 직업명 + 패시브 설명
- 스탯 바 4개: Fluency / Grammar / Vocabulary / Delivery
  - 직업 선택 시 실시간 업데이트
  - 스탯 값은 백엔드 `CharacterStats.initByJob` 기준: 강점 스탯 `3`, 나머지 `1`
  - 표시: 강점 `●●●` (3칸 풀), 기타 `●○○` (1칸) 형태

### 오른쪽 패널 — 입력 영역

- 이름 입력창 (`CHARACTER NAME`)
  - placeholder: "영웅의 이름 (2~20자)"
  - 2자 미만 또는 20자 초과 시 버튼 비활성화
- 직업 카드 2×2 그리드 (`SELECT CLASS`)
  - Warrior ⚔️ / Mage 🔮 / Knight 🛡️ / Ranger 🏹
  - 각 카드: 직업명 + 주요 스탯 강점 + 패시브 한 줄
  - 선택된 카드: 앰버 테두리 강조
- "⚔ 모험 시작" 버튼
  - 이름 유효(2~20자) + 직업 선택 완료 시에만 활성화
  - API 호출 중(`isLoading`)에도 비활성화 (중복 제출 방지)

---

## 직업별 초기 스탯 (백엔드 `CharacterStats.initByJob` 기준)

| 직업 | Fluency | Grammar | Vocabulary | Delivery |
|---|---|---|---|---|
| Warrior | 3 (●●●) | 1 (●○○) | 1 (●○○) | 1 (●○○) |
| Mage | 1 (●○○) | 1 (●○○) | 3 (●●●) | 1 (●○○) |
| Knight | 1 (●○○) | 3 (●●●) | 1 (●○○) | 1 (●○○) |
| Ranger | 1 (●○○) | 1 (●○○) | 1 (●○○) | 3 (●●●) |

---

## API 연동

### 캐릭터 존재 확인 (마운트 시)
- `GET /api/characters/me`
  - 200 → 이미 캐릭터 존재: `/game`으로 리다이렉트
  - 200 이외 모든 응답(에러 포함) → 캐릭터 없음으로 간주, 페이지 정상 렌더
  - (백엔드가 캐릭터 없을 때 500 반환하므로 상태코드 분기 없이 try/catch로 처리)

### 캐릭터 생성 (폼 제출)
- `POST /api/characters`
  - body: `{ name: string, job: "WARRIOR" | "MAGE" | "KNIGHT" | "RANGER" }`
  - 성공(201) → 응답 데이터 사용 안 함, `/game`으로 이동 (GamePage에서 필요 시 별도 조회)
  - (백엔드 `CharacterController.createCharacter` 를 `ResponseEntity.status(CREATED)` 로 수정 완료)
  - 실패 → `err.response?.data?.message || '캐릭터 생성에 실패했습니다.'` 인라인 표시

---

## 상태 관리

`CharacterCreatePage` 내부 로컬 상태로 관리 (Zustand 불필요):

```js
const [name, setName] = useState('')
const [selectedJob, setSelectedJob] = useState(null)
const [isLoading, setIsLoading] = useState(false)
const [isChecking, setIsChecking] = useState(true) // 마운트 시 캐릭터 존재 확인
const [error, setError] = useState(null)
```

---

## 이미지 전략

```js
import heroImg from '@/assets/hero.png'

const jobImages = {
  WARRIOR: heroImg,  // 추후 warriorImg로 교체
  MAGE: heroImg,
  KNIGHT: heroImg,
  RANGER: heroImg,
}
```

---

## 파일 구조

```
frontend/src/
  pages/character/
    CharacterCreatePage.jsx   (기존 플레이스홀더 교체)
    CharacterCreatePage.css   (신규)
  api/
    characterApi.js           (신규 또는 기존에 추가)
```

---

## 완료 조건

- [ ] 로그인 후 newUser/isNew 분기 동작 (이메일 + OAuth2 모두)
- [ ] 마운트 시 기존 캐릭터 보유 유저 → `/game` 리다이렉트
- [ ] 직업 선택 시 왼쪽 패널 실시간 업데이트 (이미지 + 스탯)
- [ ] 이름(2~20자) + 직업 둘 다 선택해야 버튼 활성화
- [ ] API 호출 중 버튼 비활성화 (중복 제출 방지)
- [ ] API 호출 성공 후 `/game` 이동
- [ ] 실패 시 에러 메시지 인라인 표시
