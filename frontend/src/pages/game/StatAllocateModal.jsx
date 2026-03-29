import { useState } from 'react'
import { allocateStat } from '@/api/characterApi'
import './StatAllocateModal.css'

const STAT_INFO = {
  fluency:    { label: 'Fluency',    desc: '기본 데미지 배율 증가', icon: '⚡' },
  grammar:    { label: 'Grammar',    desc: '몬스터 반격 데미지 감소', icon: '🛡' },
  vocabulary: { label: 'Vocabulary', desc: '크리티컬 확률 증가', icon: '✨' },
  delivery:   { label: 'Delivery',   desc: '준비시간 +5초 보너스', icon: '🎯' },
}

export default function StatAllocateModal({ character, onClose, onAllocated }) {
  const [pending, setPending] = useState({
    fluency: 0, grammar: 0, vocabulary: 0, delivery: 0,
  })
  const [loading, setLoading] = useState(false)

  const remaining = character.statPoints - Object.values(pending).reduce((a, b) => a + b, 0)

  const increment = (stat) => {
    if (remaining <= 0) return
    setPending((p) => ({ ...p, [stat]: p[stat] + 1 }))
  }

  const decrement = (stat) => {
    if (pending[stat] <= 0) return
    setPending((p) => ({ ...p, [stat]: p[stat] - 1 }))
  }

  const handleConfirm = async () => {
    const entries = Object.entries(pending).filter(([, v]) => v > 0)
    if (entries.length === 0) { onClose(); return }

    setLoading(true)
    try {
      let updated = null
      for (const [statName, amount] of entries) {
        updated = await allocateStat(statName, amount)
      }
      onAllocated(updated)
      onClose()
    } catch (err) {
      console.error('스탯 배분 오류', err)
    } finally {
      setLoading(false)
    }
  }

  const stats = character.stats || {}

  return (
    <div className="stat-modal-overlay" onClick={onClose}>
      <div className="stat-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="stat-modal-title">⬆ 스탯 포인트 배분</div>
        <div className="stat-modal-points">
          남은 포인트: <span className={remaining === 0 ? 'zero' : 'positive'}>{remaining}</span>
        </div>

        <div className="stat-modal-list">
          {Object.entries(STAT_INFO).map(([key, info]) => (
            <div key={key} className="stat-row">
              <div className="stat-row-left">
                <span className="stat-icon">{info.icon}</span>
                <div>
                  <div className="stat-name">{info.label}</div>
                  <div className="stat-desc">{info.desc}</div>
                </div>
              </div>
              <div className="stat-row-right">
                <span className="stat-current">{(stats[key] || 0)}</span>
                {pending[key] > 0 && (
                  <span className="stat-pending">+{pending[key]}</span>
                )}
                <button className="stat-btn minus" onClick={() => decrement(key)} disabled={pending[key] === 0}>−</button>
                <button className="stat-btn plus" onClick={() => increment(key)} disabled={remaining === 0}>＋</button>
              </div>
            </div>
          ))}
        </div>

        <div className="stat-modal-actions">
          <button className="stat-cancel-btn" onClick={onClose} disabled={loading}>취소</button>
          <button className="stat-confirm-btn" onClick={handleConfirm} disabled={loading}>
            {loading ? '저장 중...' : '확인'}
          </button>
        </div>
      </div>
    </div>
  )
}
