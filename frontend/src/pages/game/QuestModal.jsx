import { useState, useEffect } from 'react'
import { getTodayQuests, claimQuestReward } from '@/api/questApi'
import useCharacterStore from '@/store/characterStore'
import './QuestModal.css'

const QUEST_TYPE_LABELS = {
  KILL: '처치',
  CRITICAL: '크리티컬',
  REVIEW: '복습',
  PART_CLEAR: '파트 클리어',
}

function formatDate(date) {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

export default function QuestModal({ onClose }) {
  const setCharacter = useCharacterStore((s) => s.setCharacter)

  const [quests, setQuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [claiming, setClaiming] = useState(null)

  useEffect(() => {
    getTodayQuests()
      .then(setQuests)
      .catch(() => setError('퀘스트를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  const handleClaim = async (quest) => {
    if (claiming) return
    setClaiming(quest.userQuestId)
    setError(null)
    try {
      const updatedCharacter = await claimQuestReward(quest.userQuestId)
      setCharacter(updatedCharacter)
      setQuests((prev) =>
        prev.map((q) =>
          q.userQuestId === quest.userQuestId ? { ...q, completed: true, claimed: true } : q
        )
      )
    } catch {
      setError('보상 수령에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setClaiming(null)
    }
  }

  const progressPercent = (current, target) =>
    Math.min(100, Math.round((current / target) * 100))

  return (
    <div className="qst-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="qst-panel">
        <div className="qst-title">📋 데일리 퀘스트</div>
        <div className="qst-date">{formatDate(new Date())}</div>

        {error && <div className="qst-error">⚠️ {error}</div>}

        {loading ? (
          <div className="qst-loading">불러오는 중...</div>
        ) : quests.length === 0 ? (
          <div className="qst-empty">오늘의 퀘스트가 없습니다.</div>
        ) : (
          <div className="qst-list">
            {quests.map((quest) => {
              const isCompleted = quest.currentValue >= quest.targetValue
              const isClaimed = quest.completed
              const isClaiming = claiming === quest.userQuestId
              const pct = progressPercent(quest.currentValue, quest.targetValue)

              return (
                <div key={quest.userQuestId} className={`qst-card${isClaimed ? ' claimed' : ''}`}>
                  <div className="qst-card-top">
                    <div className="qst-card-info">
                      <div className="qst-card-name">{quest.name}</div>
                      <div className="qst-card-desc">{quest.description}</div>
                      <div className="qst-card-type">
                        {QUEST_TYPE_LABELS[quest.questType] ?? quest.questType}
                      </div>
                    </div>
                    <div className="qst-card-right">
                      <div className="qst-reward">
                        <span className="qst-reward-exp">+{quest.expReward} XP</span>
                        <span className="qst-reward-gold">+{quest.goldReward}G</span>
                      </div>
                      {isClaimed ? (
                        <span className="qst-btn-done">완료 ✅</span>
                      ) : isCompleted ? (
                        <button
                          className="qst-btn-claim"
                          onClick={() => handleClaim(quest)}
                          disabled={!!isClaiming}
                        >
                          {isClaiming ? '수령 중...' : '수령하기'}
                        </button>
                      ) : (
                        <span className="qst-btn-progress">진행 중</span>
                      )}
                    </div>
                  </div>

                  <div className="qst-progress-wrap">
                    <div className="qst-progress-bar">
                      <div
                        className="qst-progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="qst-progress-label">
                      {quest.currentValue} / {quest.targetValue}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="qst-actions">
          <button className="qst-btn-close" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  )
}
