# 캐릭터 성별 선택 + SVG 비주얼 디자인 스펙

**날짜:** 2026-03-22
**관련 단계:** 3단계 보완 — CharacterCreatePage 개선

---

## 개요

캐릭터 생성 페이지에 성별 선택(♂/♀)을 추가하고, 기존 `hero.png` 플레이스홀더를 직업×성별 SVG 캐릭터(8종)로 교체한다. 백엔드에 `gender` 필드를 추가하고 DB에 저장한다.

---

## 변경 파일 목록

### 백엔드
| 파일 | 변경 유형 |
|---|---|
| `domain/character/entity/Character.java` | 수정 — `Gender` enum + `gender` 필드 추가 |
| `domain/character/dto/CharacterCreateRequest.java` | 수정 — `gender` 필드 추가 |
| `domain/character/dto/CharacterResponse.java` | 수정 — `gender` 필드 추가 |
| `domain/character/service/CharacterService.java` | 수정 — `gender` 저장 |
| `src/main/resources/application.yml` | 수정 — `ddl-auto: validate` → `update` (개발 환경, 컬럼 추가 후 재검토) |

### 프론트엔드
| 파일 | 변경 유형 |
|---|---|
| `frontend/src/components/CharacterSvg.jsx` | 신규 — SVG 캐릭터 8종 컴포넌트 |
| `frontend/src/pages/character/CharacterCreatePage.jsx` | 수정 — gender 상태, 토글, CharacterSvg 연동 |
| `frontend/src/pages/character/CharacterCreatePage.css` | 수정 — 성별 토글 스타일 추가 |
| `frontend/src/api/characterApi.js` | 수정 — `createCharacter`에 `gender` 파라미터 추가 |

---

## 백엔드 변경 상세

### 1. Character.java — Gender enum + 필드 추가

```java
public enum Gender { MALE, FEMALE }

@Enumerated(EnumType.STRING)
@Column(name = "gender", nullable = false)
private Gender gender;
```

`@Builder`에 포함되므로 별도 수정 불필요.

### 2. CharacterCreateRequest.java

```java
@NotNull(message = "성별은 필수입니다")
private Character.Gender gender;
```

### 3. CharacterResponse.java

`gender` 필드 추가 및 `from()` 메서드에 `.gender(character.getGender())` 추가:

```java
private Character.Gender gender;
```

### 4. CharacterService.java

`createCharacter` 빌더에 추가:
```java
.gender(request.getGender())
```

### 5. application.yml — ddl-auto 변경

```yaml
ddl-auto: update   # validate → update (gender 컬럼 자동 추가)
```

> 참고: 개발 단계이므로 `update` 사용. 실제 운영 시 Flyway 마이그레이션으로 전환.

---

## 프론트엔드 변경 상세

### CharacterSvg.jsx — SVG 8종 컴포넌트

**위치:** `frontend/src/components/CharacterSvg.jsx`

**인터페이스:**
```jsx
export default function CharacterSvg({ job, gender, width = 72, height = 96 })
```

**내부 구조:**
- `job + gender` key로 SVG 맵에서 컴포넌트 선택
- 기본값: `WARRIOR` + `MALE` (job/gender 미선택 시)

**8종 SVG 특징:**

| | Warrior | Mage | Knight | Ranger |
|---|---|---|---|---|
| 남성 | 짧은 갈색 헤어, 파란 갑옷, 검 | 짧은 검정 헤어, 남색 로브, 마법 지팡이 | 은색 투구, 회색 중갑, 방패 | 짧은 갈색 헤어, 초록 의상, 활 |
| 여성 | 긴 빨간 헤어, 보라 갑옷, 검 | 긴 금발 헤어, 보라 로브, 마법 지팡이 | 긴 흰 헤어, 은색 경갑, 방패 | 긴 갈색 헤어, 초록 의상, 활 |

**SVG 공통 레이어:**
1. 발 그림자 (amber glow ellipse)
2. 망토/로브
3. 몸통
4. 머리 (피부색)
5. 헤어 (성별·직업별)
6. 눈 × 2, 입
7. 다리
8. 무기/장비

### CharacterCreatePage.jsx 변경

**추가 상태:**
```js
const [gender, setGender] = useState('MALE')
```

**성별 토글 위치:** 왼쪽 프리뷰 패널, `cc-avatar` 아래, `cc-job-name` 위

**JSX 추가:**
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

**CharacterSvg 교체:**
```jsx
// 기존 <img src={heroImg} />  →  아래로 교체
<CharacterSvg
  job={selectedJob || 'WARRIOR'}
  gender={gender}
  width={80}
  height={96}
/>
```

**createCharacter 호출 변경:**
```js
await createCharacter(name.trim(), selectedJob, gender)
```

### characterApi.js 변경

```js
export async function createCharacter(name, job, gender) {
  const response = await api.post('/characters', { name, job, gender })
  return response.data.data
}
```

### CharacterCreatePage.css 추가

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

---

## 완료 조건

- [ ] `Character` entity에 `Gender` enum + `gender` 필드 추가
- [ ] `CharacterCreateRequest`에 `gender` 필드 추가
- [ ] `CharacterResponse`에 `gender` 필드 추가
- [ ] `CharacterService`에서 `gender` 저장
- [ ] `ddl-auto: update`로 변경 (DB 컬럼 자동 생성)
- [ ] SVG 캐릭터 8종 구현 (`CharacterSvg.jsx`)
- [ ] 성별 토글 버튼 (왼쪽 프리뷰 패널)
- [ ] 성별/직업 변경 시 SVG 즉시 교체
- [ ] `createCharacter` API에 `gender` 파라미터 전달
- [ ] 직업 미선택 시 기본 SVG (WARRIOR + 선택 성별) 표시
