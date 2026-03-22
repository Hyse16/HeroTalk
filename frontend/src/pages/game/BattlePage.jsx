import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { processTurn } from '@/api/battleApi'
import useSpeechRecognition from '@/hooks/useSpeechRecognition'
import './BattlePage.css'

const MONSTER_EMOJIS = {
  슬라임: '🟢', 고블린: '👺', 스켈레톤: '💀', 오크: '👹',
  트롤: '🧌', 와이번: '🐉',
  '고블린 킹': '👑', '다크 나이트': '🦇', '사막 군주': '☀️',
  '오크 워로드': '🪓', 드래곤: '🔥',
}

// Stub score: word-count based until Gemini integration (Step 5)
function calcStubScore(transcript) {
  if (!transcript || transcript.trim().length === 0) {
    return Math.floor(Math.random() * 30) // 0~29 if no speech detected
  }
  const words = transcript.trim().split(/\s+/).length
  return Math.min(100, Math.max(5, words * 8 + Math.floor(Math.random() * 20)))
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

  const [battle, setBattle] = useState(initBattle ?? null)
  const [monsterHp, setMonsterHp] = useState(initBattle?.monsterCurrentHp ?? 0)
  const [charHp, setCharHp] = useState(initBattle?.characterCurrentHp ?? 0)
  const [currentQuestion, setCurrentQuestion] = useState(initBattle?.question ?? null)
  const [showHint, setShowHint] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [result, setResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [awaitingSTT, setAwaitingSTT] = useState(false)
  const [monsterShake, setMonsterShake] = useState(false)

  const { transcript, isListening, startListening, stopListening } = useSpeechRecognition()

  useEffect(() => {
    if (!battle) navigate('/game', { replace: true })
  }, [battle, navigate])

  const triggerShake = () => {
    setMonsterShake(true)
    setTimeout(() => setMonsterShake(false), 400)
  }

  const handleTurn = useCallback(async (action, score = null) => {
    if (!battle) return
    setProcessing(true)
    setFeedback(null)
    setShowHint(false)

    try {
      const turnResult = await processTurn(battle.battleId, action, score)

      setMonsterHp(turnResult.monsterCurrentHp)
      setCharHp(turnResult.characterCurrentHp)

      if (turnResult.damageDealt > 0) triggerShake()

      if (action !== 'FLEE') {
        setFeedback({
          score,
          damageDealt: turnResult.damageDealt,
          damageTaken: turnResult.damageTaken,
          isCritical: turnResult.isCritical,
        })
      }

      if (turnResult.battleEnded) {
        setResult({
          type: turnResult.result,
          expGained: turnResult.expGained,
          goldGained: turnResult.goldGained,
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

  // Auto-process turn when STT recording stops and transcript is available
  useEffect(() => {
    if (awaitingSTT && !isListening) {
      const score = calcStubScore(transcript)
      handleTurn('ATTACK', score)
    }
  }, [awaitingSTT, isListening, transcript, handleTurn])

  const handleAttack = () => {
    if (processing || awaitingSTT) return
    setAwaitingSTT(true)
    setShowHint(false)
    startListening()
    setTimeout(() => stopListening(), 10000)
  }

  const handleHint = () => {
    if (processing || awaitingSTT) return
    setShowHint(true)
    handleTurn('HINT', 50)
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
          <div className="battle-combatant-name">⚔ 나의 캐릭터</div>
          <HpBar current={charHp} max={battle.characterMaxHp} />
        </div>
      </div>

      {/* Battle scene sprites */}
      <div className="battle-scene">
        <div className={`battle-monster-sprite${monsterShake ? ' shake' : ''}`}>
          {monsterEmoji}
        </div>
        <div className="battle-vs">VS</div>
        <div className="battle-character-sprite">🧑‍⚔️</div>
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
                녹음 중... (10초 후 자동 종료)
              </div>
            )}
          </div>
        )}

        <div className="battle-actions">
          <button
            className="battle-action-btn attack"
            onClick={handleAttack}
            disabled={processing || awaitingSTT || !!result}
          >
            🎤 공격
            <span className="battle-action-sub">말해서 데미지</span>
          </button>
          <button
            className="battle-action-btn"
            onClick={handleHint}
            disabled={processing || awaitingSTT || !!result}
          >
            📖 힌트
            <span className="battle-action-sub">데미지 -20%</span>
          </button>
          <button
            className="battle-action-btn"
            onClick={handlePass}
            disabled={processing || awaitingSTT || !!result}
          >
            ⏭ 패스
            <span className="battle-action-sub">반격 1.5배</span>
          </button>
          <button
            className="battle-action-btn flee"
            onClick={handleFlee}
            disabled={processing || awaitingSTT || !!result}
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
          ) : feedback.score !== null ? (
            <div className="battle-feedback-score">{feedback.score}점</div>
          ) : null}
          <div className="battle-feedback-damages">
            <div>내가 준 데미지: <b style={{ color: '#4ade80' }}>-{feedback.damageDealt}</b></div>
            <div>받은 데미지: <b style={{ color: '#f87171' }}>-{feedback.damageTaken}</b></div>
            <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
              클릭하면 닫힙니다
            </div>
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
              {result.type === 'LOSE' && <div>패배 위로 경험치 +50 EXP</div>}
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
