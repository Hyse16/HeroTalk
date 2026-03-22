# Character Create Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 신규 유저가 로그인 후 캐릭터 이름과 직업을 선택하는 페이지를 구현한다.

**Architecture:** 좌우 분할 레이아웃 — 왼쪽은 직업 선택 시 실시간으로 업데이트되는 캐릭터 미리보기, 오른쪽은 이름 입력 + 직업 카드 그리드. 라우팅 분기는 이미 `LoginPage.jsx`에 구현되어 있으므로 페이지 컴포넌트와 API 함수만 구현한다.

**Tech Stack:** React 18, Vite, Zustand, Axios (`@/api/axios.js`), React Router v6, CSS (기존 LoginPage.css 스타일 참고)

---

## File Map

| 파일 | 상태 | 역할 |
|---|---|---|
| `frontend/src/api/characterApi.js` | 신규 | 캐릭터 API 호출 함수 2개 |
| `frontend/src/pages/character/CharacterCreatePage.jsx` | 교체 | 캐릭터 생성 메인 컴포넌트 |
| `frontend/src/pages/character/CharacterCreatePage.css` | 신규 | 페이지 스타일 (다크판타지 테마) |

---

## Task 1: characterApi.js 작성

**Files:**
- Create: `frontend/src/api/characterApi.js`

- [ ] **Step 1: 파일 생성**

```js
// frontend/src/api/characterApi.js
import api from '@/api/axios'

export async function checkCharacterExists() {
  const response = await api.get('/characters/me')
  return response.data.data // CharacterResponse
}

export async function createCharacter(name, job) {
  const response = await api.post('/characters', { name, job })
  return response.data.data // CharacterResponse
}
```

- [ ] **Step 2: 커밋**

```bash
git add frontend/src/api/characterApi.js
git commit -m "feat: characterApi 추가 (checkCharacterExists, createCharacter)"
```

---

## Task 2: CharacterCreatePage.css 작성

**Files:**
- Create: `frontend/src/pages/character/CharacterCreatePage.css`

- [ ] **Step 1: CSS 파일 작성**

로그인 페이지(`LoginPage.css`)와 동일한 다크판타지 톤. 핵심 클래스:

```css
/* frontend/src/pages/character/CharacterCreatePage.css */

.character-create-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 50%, #16213e 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  font-family: 'Cinzel', serif;
  color: #fff;
}

/* 상단 타이틀 */
.cc-header {
  text-align: center;
  margin-bottom: 32px;
}
.cc-header-label {
  color: #f59e0b;
  font-size: 11px;
  letter-spacing: 4px;
  margin-bottom: 8px;
}
.cc-header-title {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}
.cc-header-sub {
  color: #666;
  font-size: 12px;
  margin-top: 4px;
  font-family: sans-serif;
}

/* 좌우 분할 컨테이너 */
.cc-body {
  display: flex;
  gap: 32px;
  width: 100%;
  max-width: 860px;
  align-items: stretch;
}

/* 왼쪽: 캐릭터 미리보기 */
.cc-preview {
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 12px;
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cc-preview-label {
  color: #f59e0b;
  font-size: 9px;
  letter-spacing: 2px;
  margin-bottom: 20px;
}
.cc-avatar {
  width: 120px;
  height: 120px;
  background: rgba(245, 158, 11, 0.1);
  border: 2px solid rgba(245, 158, 11, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  overflow: hidden;
  transition: border-color 0.3s;
}
.cc-avatar img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  image-rendering: pixelated;
}
.cc-avatar-selected {
  border-color: #f59e0b;
}
.cc-job-name {
  color: #f59e0b;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
}
.cc-job-passive {
  color: #888;
  font-size: 11px;
  margin-bottom: 24px;
  font-family: sans-serif;
  text-align: center;
}

/* 스탯 바 */
.cc-stats {
  width: 100%;
}
.cc-stats-label {
  color: #888;
  font-size: 9px;
  letter-spacing: 2px;
  margin-bottom: 12px;
}
.cc-stat-row {
  margin-bottom: 10px;
}
.cc-stat-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.cc-stat-name {
  color: #aaa;
  font-size: 11px;
  font-family: sans-serif;
}
.cc-stat-dots {
  display: flex;
  gap: 4px;
}
.cc-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  transition: background 0.3s;
}
.cc-dot.filled {
  background: #f59e0b;
}

/* 오른쪽: 입력 영역 */
.cc-form {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 이름 입력 */
.cc-section-label {
  color: #f59e0b;
  font-size: 9px;
  letter-spacing: 2px;
  margin-bottom: 8px;
}
.cc-name-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  color: #fff;
  font-size: 14px;
  font-family: sans-serif;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.cc-name-input::placeholder {
  color: #555;
}
.cc-name-input:focus {
  border-color: #f59e0b;
}

/* 직업 카드 그리드 */
.cc-job-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.cc-job-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.cc-job-card:hover {
  border-color: rgba(245, 158, 11, 0.4);
  background: rgba(245, 158, 11, 0.05);
}
.cc-job-card.selected {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}
.cc-job-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.cc-job-icon {
  font-size: 18px;
}
.cc-job-card-name {
  font-size: 13px;
  font-weight: bold;
  color: #aaa;
  transition: color 0.2s;
}
.cc-job-card.selected .cc-job-card-name {
  color: #f59e0b;
}
.cc-job-stat-strong {
  color: #aaa;
  font-size: 10px;
  font-family: sans-serif;
}
.cc-job-passive-short {
  color: #666;
  font-size: 9px;
  font-family: sans-serif;
  margin-top: 2px;
}

/* 에러 메시지 */
.cc-error {
  color: #f87171;
  font-size: 12px;
  font-family: sans-serif;
}

/* 시작 버튼 */
.cc-submit-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none;
  border-radius: 8px;
  padding: 14px;
  text-align: center;
  color: #000;
  font-weight: bold;
  font-size: 13px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  font-family: 'Cinzel', serif;
  margin-top: auto;
}
.cc-submit-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.cc-submit-btn:not(:disabled):hover {
  transform: translateY(-1px);
}
.cc-submit-btn:not(:disabled):active {
  transform: translateY(0);
}

/* 로딩 전체 화면 (마운트 시 캐릭터 체크) */
.cc-loading {
  min-height: 100vh;
  background: #0d0d1a;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f59e0b;
  font-size: 14px;
  letter-spacing: 2px;
}
```

- [ ] **Step 2: 커밋**

```bash
git add frontend/src/pages/character/CharacterCreatePage.css
git commit -m "feat: CharacterCreatePage CSS 추가 (다크판타지 테마)"
```

---

## Task 3: CharacterCreatePage.jsx 구현

**Files:**
- Modify: `frontend/src/pages/character/CharacterCreatePage.jsx` (기존 플레이스홀더 교체)

- [ ] **Step 1: 직업 데이터 및 컴포넌트 뼈대 작성**

```jsx
// frontend/src/pages/character/CharacterCreatePage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import heroImg from '@/assets/hero.png'
import { checkCharacterExists, createCharacter } from '@/api/characterApi'
import './CharacterCreatePage.css'

// 직업별 이미지 맵 (추후 직업별 이미지로 교체)
const jobImages = {
  WARRIOR: heroImg,
  MAGE: heroImg,
  KNIGHT: heroImg,
  RANGER: heroImg,
}

// 직업 정의 데이터
const JOBS = [
  {
    id: 'WARRIOR',
    name: 'Warrior',
    icon: '⚔️',
    statStrong: 'Fluency ↑↑',
    passive: '짧은 답변 데미지 보너스',
    stats: { fluency: 3, grammar: 1, vocabulary: 1, delivery: 1 },
  },
  {
    id: 'MAGE',
    name: 'Mage',
    icon: '🔮',
    statStrong: 'Vocabulary ↑↑',
    passive: '어휘 채점 보너스 +10%',
    stats: { fluency: 1, grammar: 1, vocabulary: 3, delivery: 1 },
  },
  {
    id: 'KNIGHT',
    name: 'Knight',
    icon: '🛡️',
    statStrong: 'Grammar ↑↑',
    passive: '문법 실수 패널티 감소',
    stats: { fluency: 1, grammar: 3, vocabulary: 1, delivery: 1 },
  },
  {
    id: 'RANGER',
    name: 'Ranger',
    icon: '🏹',
    statStrong: 'Delivery ↑↑',
    passive: '준비시간 +10초 보너스',
    stats: { fluency: 1, grammar: 1, vocabulary: 1, delivery: 3 },
  },
]

const STAT_LABELS = ['Fluency', 'Grammar', 'Vocabulary', 'Delivery']
const STAT_KEYS = ['fluency', 'grammar', 'vocabulary', 'delivery']
const MAX_STAT = 3

export default function CharacterCreatePage() {
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true)
  const [name, setName] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // 마운트 시 기존 캐릭터 확인 (이미 있으면 /game으로)
  useEffect(() => {
    checkCharacterExists()
      .then(() => navigate('/game', { replace: true }))
      .catch(() => setIsChecking(false))
  }, [navigate])

  const isNameValid = name.trim().length >= 2 && name.trim().length <= 20
  const canSubmit = isNameValid && selectedJob !== null && !isLoading

  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsLoading(true)
    setError(null)
    try {
      await createCharacter(name.trim(), selectedJob)
      navigate('/game', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || '캐릭터 생성에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return <div className="cc-loading">Loading...</div>
  }

  const currentJob = JOBS.find((j) => j.id === selectedJob)

  return (
    <div className="character-create-page">
      {/* 상단 타이틀 */}
      <div className="cc-header">
        <div className="cc-header-label">HERO TALK</div>
        <div className="cc-header-title">나만의 영웅을 만들어라</div>
        <div className="cc-header-sub">직업을 선택하고 모험을 시작하세요</div>
      </div>

      <div className="cc-body">
        {/* 왼쪽: 캐릭터 미리보기 */}
        <div className="cc-preview">
          <div className="cc-preview-label">CHARACTER PREVIEW</div>
          <div className={`cc-avatar ${selectedJob ? 'cc-avatar-selected' : ''}`}>
            <img
              src={selectedJob ? jobImages[selectedJob] : heroImg}
              alt="character"
            />
          </div>
          <div className="cc-job-name">
            {currentJob ? currentJob.name : '???'}
          </div>
          <div className="cc-job-passive">
            {currentJob ? currentJob.passive : '직업을 선택하세요'}
          </div>

          <div className="cc-stats">
            <div className="cc-stats-label">INITIAL STATS</div>
            {STAT_LABELS.map((label, i) => {
              const val = currentJob ? currentJob.stats[STAT_KEYS[i]] : 0
              return (
                <div className="cc-stat-row" key={label}>
                  <div className="cc-stat-header">
                    <span className="cc-stat-name">{label}</span>
                    <div className="cc-stat-dots">
                      {Array.from({ length: MAX_STAT }).map((_, dotIdx) => (
                        <div
                          key={dotIdx}
                          className={`cc-dot ${dotIdx < val ? 'filled' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 오른쪽: 이름 + 직업 선택 */}
        <div className="cc-form">
          {/* 이름 입력 */}
          <div>
            <div className="cc-section-label">CHARACTER NAME</div>
            <input
              className="cc-name-input"
              type="text"
              placeholder="영웅의 이름 (2~20자)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
            />
          </div>

          {/* 직업 선택 */}
          <div>
            <div className="cc-section-label">SELECT CLASS</div>
            <div className="cc-job-grid">
              {JOBS.map((job) => (
                <div
                  key={job.id}
                  className={`cc-job-card ${selectedJob === job.id ? 'selected' : ''}`}
                  onClick={() => setSelectedJob(job.id)}
                >
                  <div className="cc-job-card-header">
                    <span className="cc-job-icon">{job.icon}</span>
                    <span className="cc-job-card-name">{job.name}</span>
                  </div>
                  <div className="cc-job-stat-strong">{job.statStrong}</div>
                  <div className="cc-job-passive-short">{job.passive}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 에러 */}
          {error && <div className="cc-error">⚠️ {error}</div>}

          {/* 제출 버튼 */}
          <button
            className="cc-submit-btn"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isLoading ? '처리 중...' : '⚔ 모험 시작'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 브라우저에서 동작 확인**

```bash
cd frontend && npm run dev
```

확인 사항:
- `/character/create` 접속 시 페이지 렌더 (이미 캐릭터 있으면 `/game` 리다이렉트)
- 직업 클릭 시 왼쪽 미리보기 실시간 업데이트
- 이름 2자 미만 or 직업 미선택 시 버튼 비활성화
- 이름 입력 + 직업 선택 → 버튼 활성화

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/pages/character/CharacterCreatePage.jsx
git commit -m "feat: 캐릭터 생성 페이지 구현 (좌우 분할 레이아웃, 직업 선택, API 연동)"
```

---

## Task 4: 전체 흐름 통합 확인

**Files:**
- 수정 없음 (LoginPage.jsx 라우팅 분기 이미 구현됨)

- [ ] **Step 1: 신규 유저 흐름 확인**

로그인 → `AuthResponse.newUser == true` → `/character/create` 리다이렉트 → 이름/직업 선택 → 제출 → `/game` 이동

- [ ] **Step 2: 기존 유저 흐름 확인**

로그인 → `AuthResponse.newUser == false` → `/game` 바로 이동 (캐릭터 생성 페이지 스킵)

- [ ] **Step 3: 직접 접근 방어 확인**

캐릭터 있는 유저가 `/character/create` 직접 URL 입력 → `/game` 리다이렉트

- [ ] **Step 4: 최종 커밋 및 PR**

```bash
git add -A
git commit -m "chore: 캐릭터 생성 3단계 완료"
```

---

## 완료 조건 체크리스트

- [ ] 로그인 후 newUser/isNew 분기 동작 (이메일 + OAuth2)
- [ ] 마운트 시 기존 캐릭터 보유 유저 `/game` 리다이렉트
- [ ] 직업 선택 시 왼쪽 패널 실시간 업데이트
- [ ] 이름(2~20자) + 직업 모두 입력해야 버튼 활성화
- [ ] API 호출 중 버튼 비활성화
- [ ] API 성공 후 `/game` 이동
- [ ] 실패 시 에러 메시지 인라인 표시
