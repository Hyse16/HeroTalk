import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { processTurn } from '@/api/battleApi'
import useSpeechRecognition from '@/hooks/useSpeechRecognition'
import useCharacterStore from '@/store/characterStore'
import './BattlePage.css'

// ── Canvas character sprite (mirrors TownScene drawJobCharacter) ─────────────
function hexRgba(hex, alpha = 1) {
  const r = (hex >> 16) & 0xff
  const g = (hex >> 8) & 0xff
  const b = hex & 0xff
  return `rgba(${r},${g},${b},${alpha})`
}

function roundedRect(ctx, x, y, w, h, r) {
  if (typeof r === 'object') {
    const { tl = 0, tr = 0, br = 0, bl = 0 } = r
    ctx.beginPath()
    ctx.moveTo(x + tl, y)
    ctx.lineTo(x + w - tr, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + tr)
    ctx.lineTo(x + w, y + h - br)
    ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h)
    ctx.lineTo(x + bl, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - bl)
    ctx.lineTo(x, y + tl)
    ctx.quadraticCurveTo(x, y, x + tl, y)
    ctx.closePath()
  } else {
    const rad = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rad, y)
    ctx.lineTo(x + w - rad, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad)
    ctx.lineTo(x + w, y + h - rad)
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h)
    ctx.lineTo(x + rad, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad)
    ctx.lineTo(x, y + rad)
    ctx.quadraticCurveTo(x, y, x + rad, y)
    ctx.closePath()
  }
}

function drawCharOnCanvas(ctx, job, gender) {
  const isFemale = gender === 'FEMALE'
  const palette = {
    WARRIOR: { cape: 0x1d4ed8, body: 0x3b82f6, legs: 0x1e3a8a, accent: 0x93c5fd },
    MAGE:    { cape: 0x4c1d95, body: 0x7c3aed, legs: 0x5b21b6, accent: 0xa78bfa },
    KNIGHT:  { cape: 0x374151, body: 0x6b7280, legs: 0x1f2937, accent: 0xd1d5db },
    RANGER:  { cape: 0x14532d, body: 0x16a34a, legs: 0x14532d, accent: 0x86efac },
  }
  const p = palette[job] || palette.WARRIOR
  const HAIR = {
    WARRIOR_MALE: 0x5c3d1e, WARRIOR_FEMALE: 0xc0392b,
    MAGE_MALE:    0x1a1a1a, MAGE_FEMALE:    0xf59e0b,
    KNIGHT_MALE:  0x9ca3af, KNIGHT_FEMALE:  0xf9fafb,
    RANGER_MALE:  0x5c3d1e, RANGER_FEMALE:  0x78350f,
  }
  const hairColor = HAIR[`${job}_${gender}`] || 0x5c3d1e
  const SKIN = 0xf5c89a

  const fill    = (hex, a = 1)         => { ctx.fillStyle   = hexRgba(hex, a) }
  const setLine = (lw, hex, a = 1)     => { ctx.lineWidth   = lw; ctx.strokeStyle = hexRgba(hex, a) }
  const circle  = (x, y, r)            => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill() }
  const ellipse = (x, y, w, h)         => { ctx.beginPath(); ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill() }
  const tri     = (x1,y1,x2,y2,x3,y3) => { ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.closePath(); ctx.fill() }
  const frr     = (x, y, w, h, r)     => { roundedRect(ctx, x, y, w, h, r); ctx.fill() }
  const srr     = (x, y, w, h, r)     => { roundedRect(ctx, x, y, w, h, r); ctx.stroke() }

  // 발그림자
  fill(0x000000, 0.25); ellipse(0, 2, 32, 8)
  // 망토
  fill(p.cape, 0.85)
  tri(-15,-25, 15,-25, -20, 6)
  tri(-15,-25, 15,-25,  20, 6)
  // 다리
  fill(p.legs); frr(-12,-2, 10,22, 2); frr(2,-2, 10,22, 2)
  // 몸통
  fill(p.body); frr(-12,-30, 24,30, 3)
  // 머리
  fill(SKIN); circle(0,-43,12)

  if (job === 'WARRIOR') {
    fill(hairColor)
    if (isFemale) { ctx.fillRect(-14,-52,6,26); ctx.fillRect(8,-52,6,26) }
    frr(-12,-56,24,15,{tl:12,tr:12,bl:0,br:0})
    fill(0x94a3b8); frr(16,-28,4,34,1)
    fill(0xcbd5e1); frr(12,-28,12,5,1)

  } else if (job === 'MAGE') {
    fill(p.body); tri(-11,-44, 11,-44, 0,-76); frr(-13,-47,26,7,2)
    if (isFemale) { fill(hairColor); ctx.fillRect(-14,-52,6,16); ctx.fillRect(8,-52,6,16) }
    fill(0x9ca3af); frr(16,-28,3,36,1)
    fill(p.accent,0.3); circle(17,-33,14)
    fill(p.accent);    circle(17,-33,8)
    fill(0xffffff,0.7);circle(14,-37,3)

  } else if (job === 'KNIGHT') {
    fill(p.accent); frr(-13,-57,26,18,4)
    frr(-26,-28,13,20,2)
    setLine(1.5, p.body); srr(-26,-28,13,20,2)

  } else if (job === 'RANGER') {
    fill(p.cape); circle(0,-46,14); tri(-11,-44,11,-44,0,-28)
    if (isFemale) { fill(hairColor); ctx.fillRect(-14,-52,5,20); ctx.fillRect(9,-52,5,20) }
    setLine(3, 0x92400e)
    ctx.beginPath(); ctx.arc(24,-12,20,-Math.PI*0.55,Math.PI*0.55,false); ctx.stroke()
    setLine(1, 0xd1d5db)
    ctx.beginPath(); ctx.moveTo(5,-23); ctx.lineTo(5,11); ctx.stroke()
  }

  // 눈
  if (job === 'KNIGHT') {
    fill(0xffffff,0.9); ellipse(-4,-43,4,2.5); ellipse(4,-43,4,2.5)
  } else {
    fill(0x1a1a2a); ellipse(-5,-43,5,3.5); ellipse(5,-43,5,3.5)
    fill(0xffffff,0.6); ellipse(-4,-44,2,2); ellipse(6,-44,2,2)
  }
}

function CharacterSprite({ job = 'WARRIOR', gender = 'MALE' }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(60, 120)   // center-x=60, feet at y=120
    ctx.scale(1.5, 1.5)
    drawCharOnCanvas(ctx, job, gender)
    ctx.restore()
  }, [job, gender])
  return <canvas ref={ref} width={120} height={160} />
}

const MONSTER_EMOJIS = {
  슬라임: '🟢', 고블린: '👺', 스켈레톤: '💀', 오크: '👹',
  트롤: '🧌', 와이번: '🐉',
  '고블린 킹': '👑', '다크 나이트': '🦇', '사막 군주': '☀️',
  '오크 워로드': '🪓', 드래곤: '🔥',
}


function HpBar({ current, max }) {
  const pct = max > 0 ? (current / max) * 100 : 0
  const colorClass = pct > 50 ? 'green' : pct > 20 ? 'yellow' : 'red'
  return (
    <div>
      <div className="battle-hpbar-wrap">
        <div className={`battle-hpbar-fill ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="battle-hp-text">{current} / {max}</div>
    </div>
  )
}

export default function BattlePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { battleData: initBattle, monster } = location.state ?? {}
  const character = useCharacterStore((state) => state.character)
  const charJob    = character?.job    || 'WARRIOR'
  const charGender = character?.gender || 'MALE'

  const [battle, setBattle] = useState(initBattle ?? null)
  const [monsterHp, setMonsterHp] = useState(initBattle?.monsterCurrentHp ?? 0)
  const [charHp, setCharHp] = useState(initBattle?.characterCurrentHp ?? 0)
  const [currentQuestion, setCurrentQuestion] = useState(initBattle?.question ?? null)
  const [showHint, setShowHint] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [result, setResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [awaitingSTT, setAwaitingSTT] = useState(false)
  const [retryConfirm, setRetryConfirm] = useState(false)  // "한번 더 녹음?" 다이얼로그
  const [hintUsed, setHintUsed] = useState(false)   // 힌트 본 상태 → 다음 공격에 -20% 적용
  const [monsterShake, setMonsterShake] = useState(false)

  // transcriptRef는 훅 내부에서 동기적으로 관리 (race condition 제거)
  const { transcript, transcriptRef, isListening, startListening, stopListening } = useSpeechRecognition()

  useEffect(() => {
    if (!battle || !monster) navigate('/game', { replace: true })
  }, [battle, monster, navigate])

  const triggerShake = () => {
    setMonsterShake(true)
    setTimeout(() => setMonsterShake(false), 400)
  }

  const handleTurn = useCallback(async (action, opts = {}) => {
    if (!battle) return
    setProcessing(true)
    setFeedback(null)

    try {
      const turnResult = await processTurn(battle.battleId, action, opts)

      setMonsterHp(turnResult.monsterCurrentHp)
      setCharHp(turnResult.characterCurrentHp)

      if (turnResult.damageDealt > 0) triggerShake()

      if (action !== 'FLEE') {
        setFeedback({
          score: turnResult.score,
          damageDealt: turnResult.damageDealt,
          damageTaken: turnResult.damageTaken,
          isCritical: turnResult.isCritical,
          feedbackGood: turnResult.feedbackGood,
          feedbackBad: turnResult.feedbackBad,
          sampleAnswer: turnResult.sampleAnswer,
        })
      }

      if (turnResult.battleEnded) {
        setResult({
          type: turnResult.result,
          expGained: turnResult.expGained,
          goldGained: turnResult.goldGained,
          leveledUp: turnResult.leveledUp,
          newLevel: turnResult.newLevel,
          newStatPoints: turnResult.newStatPoints,
        })
      } else if (turnResult.nextQuestion) {
        setCurrentQuestion(turnResult.nextQuestion)
      }
    } catch (err) {
      console.error('턴 처리 오류', err)
    } finally {
      setProcessing(false)
      setAwaitingSTT(false)
    }
  }, [battle])

  // 녹음 종료 시 → 즉시 제출 대신 재시도 다이얼로그 표시
  useEffect(() => {
    if (awaitingSTT && !isListening && !retryConfirm) {
      setRetryConfirm(true)
    }
  }, [awaitingSTT, isListening])  // eslint-disable-line react-hooks/exhaustive-deps

  const handleAttack = () => {
    if (processing || awaitingSTT) return
    setRetryConfirm(false)
    setAwaitingSTT(true)
    startListening()
  }

  // "공격 완료" — 녹음 중단 → 재시도 다이얼로그
  const handleStopAttack = () => {
    stopListening()
    // isListening이 false로 바뀌면 위 useEffect가 retryConfirm=true 설정
  }

  // "예, 다시 녹음" — 재시도
  const handleRetry = () => {
    setRetryConfirm(false)
    startListening()
  }

  // "아니오, 제출" — AI 채점 요청
  const handleSubmitAttack = useCallback(() => {
    setRetryConfirm(false)
    setAwaitingSTT(false)
    const action = hintUsed ? 'HINT' : 'ATTACK'
    handleTurn(action, { transcript: transcriptRef.current || '' })
    setHintUsed(false)
  }, [hintUsed, handleTurn, transcriptRef])

  const handleHint = () => {
    if (processing || awaitingSTT) return
    setShowHint(true)   // 힌트 텍스트 표시
    setHintUsed(true)   // 다음 공격에 HINT 액션 적용 (-20% 페널티)
    // 턴을 소비하지 않고 힌트만 표시 → 이후 공격 버튼으로 말하기
  }

  const handlePass = () => {
    if (processing || awaitingSTT) return
    handleTurn('PASS')
  }

  const handleFlee = () => {
    if (processing || awaitingSTT) return
    handleTurn('FLEE')
  }

  if (!battle || !monster) return null

  const monsterEmoji = MONSTER_EMOJIS[monster.name] ?? '👾'
  const isBoss = monster.monsterType === 'BOSS' || monster.monsterType === 'WEEKLY_BOSS'

  return (
    <div className="battle-page">

      {/* HP Bars */}
      <div className="battle-hpbars">
        <div className="battle-combatant monster">
          <div className="battle-combatant-name">
            {monsterEmoji} {monster.name}{isBoss ? ' ⭐' : ''}
          </div>
          <HpBar current={monsterHp} max={monster.hp} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '20px', color: '#f0c040' }}>VS</div>
        <div className="battle-combatant">
          <div className="battle-combatant-name">⚔ {character?.name || '나의 캐릭터'}</div>
          <HpBar current={charHp} max={battle.characterMaxHp} />
        </div>
      </div>

      {/* Battle scene sprites */}
      <div className="battle-scene">
        <div className={`battle-monster-sprite${monsterShake ? ' shake' : ''}`}>
          {monsterEmoji}
        </div>
        <div className="battle-vs">VS</div>
        <div className="battle-character-sprite">
          <CharacterSprite job={charJob} gender={charGender} />
        </div>
      </div>

      {/* Question + Action Buttons */}
      <div className="battle-bottom">
        {currentQuestion && (
          <div className="battle-question-box">
            <div className="battle-question-label">
              {currentQuestion.toeicPart} — 이 문제에 답변하세요
            </div>
            <div className="battle-question-text">{currentQuestion.questionText}</div>
            {showHint && currentQuestion.hint && (
              <div className="battle-hint-text">💡 힌트: {currentQuestion.hint}</div>
            )}
            {isListening && (
              <div className="battle-recording">
                <div className="battle-recording-dot" />
                🎤 녹음 중... {hintUsed ? '(힌트 사용 -20%)' : ''}
              </div>
            )}
            {retryConfirm && !isListening && (
              <div className="battle-retry-bar">
                <span>한번 더 녹음하시겠습니까?</span>
                <button className="battle-retry-btn yes" onClick={handleRetry}>예</button>
                <button className="battle-retry-btn no"  onClick={handleSubmitAttack}>아니오</button>
              </div>
            )}
            {processing && !isListening && (
              <div className="battle-scoring">
                ⚡ AI 채점 중...
              </div>
            )}
          </div>
        )}

        <div className="battle-actions">
          {isListening ? (
            <button
              className="battle-action-btn attack"
              onClick={handleStopAttack}
            >
              ✅ 공격 완료
              <span className="battle-action-sub">녹음 중단 후 확인</span>
            </button>
          ) : (
            <button
              className="battle-action-btn attack"
              onClick={handleAttack}
              disabled={processing || awaitingSTT || retryConfirm || !!result}
            >
              🎤 {hintUsed ? '힌트+공격' : '공격 시작'}
              <span className="battle-action-sub">말해서 데미지</span>
            </button>
          )}
          <button
            className={`battle-action-btn${hintUsed ? ' hint-active' : ''}`}
            onClick={handleHint}
            disabled={processing || awaitingSTT || retryConfirm || !!result || hintUsed}
          >
            📖 힌트{hintUsed ? ' ✓' : ''}
            <span className="battle-action-sub">{hintUsed ? '공격 시 -20%' : '데미지 -20%'}</span>
          </button>
          <button
            className="battle-action-btn"
            onClick={handlePass}
            disabled={processing || awaitingSTT || retryConfirm || !!result}
          >
            ⏭ 패스
            <span className="battle-action-sub">반격 1.5배</span>
          </button>
          <button
            className="battle-action-btn flee"
            onClick={handleFlee}
            disabled={processing || awaitingSTT || retryConfirm || !!result}
          >
            🏃 도망
            <span className="battle-action-sub">하루 3회</span>
          </button>
        </div>
      </div>

      {/* Turn feedback overlay */}
      {feedback && (
        <div className="battle-feedback" onClick={() => setFeedback(null)}>
          {feedback.isCritical ? (
            <div className="battle-feedback-score critical">💥 CRITICAL!</div>
          ) : feedback.score != null ? (
            <div className="battle-feedback-score">{feedback.score}점</div>
          ) : null}
          <div className="battle-feedback-damages">
            <div>내가 준 데미지: <b style={{ color: '#4ade80' }}>-{feedback.damageDealt}</b></div>
            <div>받은 데미지: <b style={{ color: '#f87171' }}>-{feedback.damageTaken}</b></div>
          </div>
          {feedback.feedbackGood && (
            <div className="battle-feedback-ai">
              <div className="battle-feedback-good">👍 {feedback.feedbackGood}</div>
              <div className="battle-feedback-bad">💡 {feedback.feedbackBad}</div>
              {feedback.sampleAnswer && (
                <div className="battle-feedback-sample">
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>모범 답안</span>
                  <div>"{feedback.sampleAnswer}"</div>
                </div>
              )}
            </div>
          )}
          <div style={{ color: '#555', fontSize: '11px', marginTop: '8px' }}>
            클릭하면 닫힙니다
          </div>
        </div>
      )}

      {/* Battle result screen */}
      {result && (
        <div className="battle-result-overlay">
          <div className="battle-result-panel">
            <div className={`battle-result-title ${result.type?.toLowerCase() ?? 'flee'}`}>
              {result.type === 'WIN' ? '🏆 승리!' : result.type === 'LOSE' ? '💀 패배' : '🏃 도망'}
            </div>
            <div className="battle-result-stats">
              {result.expGained > 0 && <div>경험치 +{result.expGained} EXP</div>}
              {result.goldGained > 0 && <div>골드 +{result.goldGained} G</div>}
              {result.leveledUp && (
                <div className="battle-levelup">
                  🎉 레벨업! Lv.{result.newLevel}
                  {result.newStatPoints > 0 && (
                    <span className="battle-statpoints"> (스탯 포인트 +3)</span>
                  )}
                </div>
              )}
            </div>
            <button
              className="battle-result-btn"
              onClick={() => navigate('/game', { replace: true })}
            >
              마을로 돌아가기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
