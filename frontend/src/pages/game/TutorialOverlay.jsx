import { useState } from 'react'
import './TutorialOverlay.css'

const TUTORIAL_KEY = 'herotalk_tutorial_done'

const STEPS = [
  {
    icon: '⚔️',
    title: 'HeroTalk에 오신 것을 환영합니다!',
    content: (
      <p className="tutorial-desc">
        <strong>말하는 만큼 강해지는</strong> 영어 말하기 RPG입니다.<br />
        마을을 탐험하고, 던전에 입장해 몬스터와 대결하세요.<br />
        영어로 답변할수록 강력한 데미지를 입힐 수 있습니다!
      </p>
    ),
  },
  {
    icon: '🗺️',
    title: '마을 이동',
    content: (
      <p className="tutorial-desc">
        <span className="key">W</span> <span className="key">A</span>{' '}
        <span className="key">S</span> <span className="key">D</span> 키로 캐릭터를 이동하고,<br />
        <span className="key">Space</span> 키로 점프할 수 있습니다.<br /><br />
        마을 우측 끝 <strong>던전 입구 NPC</strong>에 가까이 다가가면<br />
        던전 선택 창이 열립니다. 레벨에 맞는 던전을 골라보세요!
      </p>
    ),
  },
  {
    icon: '🏰',
    title: '던전 & 랜덤 인카운터',
    content: (
      <p className="tutorial-desc">
        던전 필드에서 이동하면 <strong>40% 확률</strong>로 몬스터와 조우합니다.<br />
        각 던전은 해금 레벨이 있으니 캐릭터를 먼저 성장시켜 보세요.<br /><br />
        <span style={{ color: '#f0c040' }}>
          훈련소 숲 → Lv.1 &nbsp;|&nbsp; 초보자 숲 → Lv.3 &nbsp;|&nbsp; 고블린 던전 → Lv.8
        </span>
      </p>
    ),
  },
  {
    icon: '🎤',
    title: '배틀 — 4가지 액션',
    content: (
      <div>
        <div className="tutorial-action-grid">
          <div className="tutorial-action-item">
            <div className="action-name">⚔️ 공격 (말하기)</div>
            마이크로 영어 답변 → Gemini 채점 → 데미지!
          </div>
          <div className="tutorial-action-item">
            <div className="action-name">💡 힌트 보기</div>
            키워드 힌트를 확인. 데미지 <span style={{ color: '#f87171' }}>-20%</span> 페널티.
          </div>
          <div className="tutorial-action-item">
            <div className="action-name">⏭ 패스</div>
            데미지 없이 넘어감. 몬스터 반격 <span style={{ color: '#f87171' }}>1.5배</span>.
          </div>
          <div className="tutorial-action-item">
            <div className="action-name">🏃 도망가기</div>
            배틀 종료 (하루 3회 제한). 경험치/골드 없음.
          </div>
        </div>
        <p className="tutorial-desc" style={{ marginBottom: 0 }}>
          점수가 높을수록 더 강한 데미지! <strong>100점 = 크리티컬</strong> 💥
        </p>
      </div>
    ),
  },
  {
    icon: '📈',
    title: '성장 & 스탯',
    content: (
      <p className="tutorial-desc">
        배틀 승리 시 <strong>경험치(XP)</strong>와 <strong>골드</strong>를 획득합니다.<br />
        레벨업 시 스탯 포인트 +3 — 좌하단 버튼으로 배분하세요.<br /><br />
        우측 상단에서 <strong>퀘스트, 복습, 상점, 랭킹</strong>도 이용할 수 있습니다.<br />
        이제 모험을 시작하세요! 🗡️
      </p>
    ),
  },
]

export function isTutorialDone() {
  return localStorage.getItem(TUTORIAL_KEY) === 'true'
}

export function markTutorialDone() {
  localStorage.setItem(TUTORIAL_KEY, 'true')
}

export default function TutorialOverlay({ onClose }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  const handleNext = () => {
    if (isLast) {
      markTutorialDone()
      onClose()
    } else {
      setStep((s) => s + 1)
    }
  }

  const handleSkip = () => {
    markTutorialDone()
    onClose()
  }

  return (
    <div className="tutorial-backdrop">
      <div className="tutorial-box">
        {/* Step dots */}
        <div className="tutorial-step-indicator">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`tutorial-step-dot${i === step ? ' active' : i < step ? ' done' : ''}`}
            />
          ))}
        </div>

        <div className="tutorial-icon">{current.icon}</div>
        <div className="tutorial-title">{current.title}</div>
        {current.content}

        <div className="tutorial-btn-row">
          {!isLast && (
            <button className="tutorial-btn-skip" onClick={handleSkip}>
              건너뛰기
            </button>
          )}
          <button className="tutorial-btn-next" onClick={handleNext}>
            {isLast ? '모험 시작! 🗡️' : '다음 →'}
          </button>
        </div>
      </div>
    </div>
  )
}
