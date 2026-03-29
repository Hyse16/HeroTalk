import { useState, useEffect } from 'react'
import { getGlobalRanking, getWeeklyRanking } from '@/api/rankingApi'
import './RankingModal.css'

const JOB_ICONS = {
  WARRIOR: '⚔️',
  MAGE: '🔮',
  KNIGHT: '🛡️',
  RANGER: '🏹',
}

const RANK_BADGE = {
  1: { icon: '👑', className: 'rank-gold' },
  2: { icon: '🥈', className: 'rank-silver' },
  3: { icon: '🥉', className: 'rank-bronze' },
}

export default function RankingModal({ onClose }) {
  const [tab, setTab] = useState('global')
  const [rankingList, setRankingList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const fetcher = tab === 'global' ? getGlobalRanking : getWeeklyRanking
    fetcher(10)
      .then(setRankingList)
      .catch(() => setError('랭킹을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [tab])

  return (
    <div className="rnk-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rnk-panel">
        <div className="rnk-title">🏆 랭킹</div>

        <div className="rnk-tabs">
          <button
            className={`rnk-tab${tab === 'global' ? ' active' : ''}`}
            onClick={() => setTab('global')}
          >
            글로벌
          </button>
          <button
            className={`rnk-tab${tab === 'weekly' ? ' active' : ''}`}
            onClick={() => setTab('weekly')}
          >
            주간
          </button>
        </div>

        {error && <div className="rnk-error">⚠️ {error}</div>}

        {loading ? (
          <div className="rnk-loading">불러오는 중...</div>
        ) : rankingList.length === 0 ? (
          <div className="rnk-empty">아직 랭킹 데이터가 없습니다.</div>
        ) : (
          <div className="rnk-list">
            {rankingList.map((entry) => {
              const badge = RANK_BADGE[entry.rank]
              return (
                <div key={entry.userId} className={`rnk-row${badge ? ` ${badge.className}` : ''}`}>
                  <span className="rnk-rank">
                    {badge ? badge.icon : `#${entry.rank}`}
                  </span>
                  <span className="rnk-job-icon">
                    {JOB_ICONS[entry.job] ?? '❓'}
                  </span>
                  <span className="rnk-name">{entry.characterName}</span>
                  <span className="rnk-level">Lv.{entry.level}</span>
                  <span className="rnk-score">{entry.score.toLocaleString()} XP</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="rnk-actions">
          <button className="rnk-btn-close" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  )
}
