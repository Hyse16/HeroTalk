import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDungeons, getDungeonMonsters } from '@/api/dungeonApi'
import { startBattle } from '@/api/battleApi'
import useCharacterStore from '@/store/characterStore'
import './DungeonSelectModal.css'

const MONSTER_ICONS = {
  슬라임: '🟢', 고블린: '👺', 스켈레톤: '💀', 오크: '👹',
  트롤: '🧌', 와이번: '🐉',
  '고블린 킹': '👑', '다크 나이트': '🦇', '사막 군주': '☀️',
  '오크 워로드': '🪓', 드래곤: '🔥',
}

export default function DungeonSelectModal({ onClose }) {
  const navigate = useNavigate()
  const character = useCharacterStore((s) => s.character)

  const [dungeons, setDungeons] = useState([])
  const [selectedDungeon, setSelectedDungeon] = useState(null)
  const [monsters, setMonsters] = useState([])
  const [selectedMonster, setSelectedMonster] = useState(null)
  const [loading, setLoading] = useState(true)
  const [monstersLoading, setMonstersLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)

  const charLevel = character?.level ?? 1

  useEffect(() => {
    getDungeons()
      .then(setDungeons)
      .catch(() => setError('던전 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDungeonSelect = async (dungeon) => {
    if (dungeon.requiredLevel > charLevel) return
    setSelectedDungeon(dungeon)
    setSelectedMonster(null)
    setMonstersLoading(true)
    try {
      const list = await getDungeonMonsters(dungeon.id)
      setMonsters(list)
    } catch {
      setError('몬스터 목록을 불러오지 못했습니다.')
    } finally {
      setMonstersLoading(false)
    }
  }

  const handleStart = async () => {
    if (!selectedMonster) return
    setStarting(true)
    setError(null)
    try {
      const battleData = await startBattle(selectedMonster.id)
      navigate('/battle', { state: { battleData, monster: selectedMonster } })
    } catch {
      setError('배틀 시작에 실패했습니다. 다시 시도해주세요.')
      setStarting(false)
    }
  }

  return (
    <div className="dsm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dsm-panel">
        <div className="dsm-title">⚔ 던전 선택</div>

        {error && <div className="dsm-error">⚠️ {error}</div>}

        {loading ? (
          <div className="dsm-loading">불러오는 중...</div>
        ) : (
          <>
            <div className="dsm-section-title">던전 (내 레벨: Lv.{charLevel})</div>
            <div className="dsm-dungeon-list">
              {dungeons.map((d) => {
                const locked = d.requiredLevel > charLevel
                return (
                  <div
                    key={d.id}
                    className={`dsm-dungeon-card${selectedDungeon?.id === d.id ? ' selected' : ''}${locked ? ' locked' : ''}`}
                    onClick={() => handleDungeonSelect(d)}
                  >
                    <div className="dsm-dungeon-name">{d.name}</div>
                    <div className="dsm-dungeon-meta">{d.toeicPart} · {d.region}</div>
                    {locked && (
                      <div className="dsm-dungeon-lock">🔒 Lv.{d.requiredLevel} 필요</div>
                    )}
                  </div>
                )
              })}
            </div>

            {selectedDungeon && (
              <>
                <div className="dsm-section-title">몬스터 선택</div>
                {monstersLoading ? (
                  <div className="dsm-loading">불러오는 중...</div>
                ) : (
                  <div className="dsm-monster-list">
                    {monsters.map((m) => (
                      <div
                        key={m.id}
                        className={`dsm-monster-card${selectedMonster?.id === m.id ? ' selected' : ''}`}
                        onClick={() => setSelectedMonster(m)}
                      >
                        <span className="dsm-monster-icon">
                          {MONSTER_ICONS[m.name] ?? '👾'}
                        </span>
                        <span className="dsm-monster-name">{m.name}</span>
                        <span className={`dsm-monster-type${m.monsterType === 'BOSS' || m.monsterType === 'WEEKLY_BOSS' ? ' boss' : ''}`}>
                          {m.monsterType === 'NORMAL' ? '일반' : '보스'}
                        </span>
                        <span className="dsm-monster-stats">
                          HP {m.hp} · EXP {m.expReward}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        <div className="dsm-actions">
          <button className="dsm-btn dsm-btn-cancel" onClick={onClose}>취소</button>
          <button
            className="dsm-btn dsm-btn-start"
            onClick={handleStart}
            disabled={!selectedMonster || starting}
          >
            {starting ? '시작 중...' : '⚔ 배틀 시작'}
          </button>
        </div>
      </div>
    </div>
  )
}
