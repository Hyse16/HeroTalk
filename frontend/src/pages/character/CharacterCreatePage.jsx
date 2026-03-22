import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import heroImg from '@/assets/hero.png'
import { checkCharacterExists, createCharacter } from '@/api/characterApi'
import './CharacterCreatePage.css'

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
    let cancelled = false
    checkCharacterExists()
      .then(() => {
        if (!cancelled) navigate('/game', { replace: true })
      })
      .catch(() => {
        if (!cancelled) setIsChecking(false)
      })
    return () => { cancelled = true }
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
              src={heroImg}
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
