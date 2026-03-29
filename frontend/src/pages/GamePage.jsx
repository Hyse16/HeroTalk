import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Phaser from 'phaser'
import GameConfig from '@/game/GameConfig'
import EventBus from '@/game/EventBus'
import useAuthStore from '@/store/authStore'
import useCharacterStore from '@/store/characterStore'
import { getCharacter } from '@/api/characterApi'
import { checkIn as streakCheckIn, getStreak } from '@/api/streakApi'
import DungeonSelectModal from './game/DungeonSelectModal'
import StatAllocateModal from './game/StatAllocateModal'
import ShopModal from './game/ShopModal'
import ReviewModal from './game/ReviewModal'
import RankingModal from './game/RankingModal'
import QuestModal from './game/QuestModal'
import StreakBadge from '@/components/StreakBadge'
import TutorialOverlay, { isTutorialDone } from './game/TutorialOverlay'

const JOB_ICON  = { WARRIOR: '⚔️', MAGE: '🔮', KNIGHT: '🛡️', RANGER: '🏹' }
const JOB_COLOR = { WARRIOR: '#60a5fa', MAGE: '#a78bfa', KNIGHT: '#d1d5db', RANGER: '#86efac' }

const BTN = {
  base: {
    padding: '7px 14px',
    background: 'rgba(10,10,25,0.80)',
    color: '#c0cce0',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 6, cursor: 'pointer',
    fontSize: 13, fontFamily: 'monospace',
    zIndex: 9999,
  },
}

function GamePage() {
  const gameRef      = useRef(null)
  const containerRef = useRef(null)
  const charRef      = useRef(null)
  const navigate     = useNavigate()
  const logout       = useAuthStore((state) => state.logout)
  const character    = useCharacterStore((state) => state.character)
  const setCharacter = useCharacterStore((state) => state.setCharacter)

  const [showTutorial,     setShowTutorial]     = useState(!isTutorialDone())
  const [showDungeonModal, setShowDungeonModal] = useState(false)
  const [showStatModal,    setShowStatModal]    = useState(false)
  const [showShopModal,    setShowShopModal]    = useState(false)
  const [showReviewModal,  setShowReviewModal]  = useState(false)
  const [showRankingModal, setShowRankingModal] = useState(false)
  const [showQuestModal,   setShowQuestModal]   = useState(false)
  const [streak,           setStreak]           = useState(null)

  // 캐릭터 로드 + 스트릭 체크인
  useEffect(() => {
    getCharacter()
      .then((char) => {
        setCharacter(char)
        charRef.current = char
        EventBus.emit('character-loaded', {
          job: char.job, gender: char.gender, name: char.name, level: char.level,
        })
      })
      .catch(() => navigate('/character/create', { replace: true }))

    streakCheckIn()
      .then(setStreak)
      .catch(() => getStreak().then(setStreak).catch(() => {}))
  }, [setCharacter, navigate])

  // Phaser 초기화
  useEffect(() => {
    const dungeonHandler = () => setShowDungeonModal(true)
    EventBus.on('dungeon-enter', dungeonHandler)

    const sceneReadyHandler = () => {
      if (charRef.current) {
        const c = charRef.current
        EventBus.emit('character-loaded', {
          job: c.job, gender: c.gender, name: c.name, level: c.level,
        })
      }
    }
    EventBus.on('scene-ready', sceneReadyHandler)

    if (!gameRef.current) {
      gameRef.current = new Phaser.Game({ ...GameConfig, parent: containerRef.current })
    }

    return () => {
      EventBus.off('dungeon-enter', dungeonHandler)
      EventBus.off('scene-ready', sceneReadyHandler)
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const job        = character?.job        || 'WARRIOR'
  const level      = character?.level      || 1
  const name       = character?.name       || ''
  const statPoints = character?.statPoints || 0

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0d0d1a' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* ── 캐릭터 HUD (좌하단) ── */}
      {character && (
        <div style={{
          position: 'fixed', bottom: 20, left: 20,
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'linear-gradient(135deg, rgba(10,10,30,0.92), rgba(20,20,50,0.88))',
          border: `1px solid ${JOB_COLOR[job]}44`,
          borderRadius: 10, padding: '10px 16px',
          boxShadow: `0 0 18px ${JOB_COLOR[job]}33`,
          zIndex: 9999, fontFamily: 'monospace', pointerEvents: 'auto',
        }}>
          <div style={{ fontSize: 28 }}>{JOB_ICON[job]}</div>
          <div>
            <div style={{ color: JOB_COLOR[job], fontWeight: 'bold', fontSize: 14, letterSpacing: 1 }}>
              {name}
            </div>
            <div style={{ color: '#8090b0', fontSize: 11 }}>
              Lv.{level} &nbsp;·&nbsp; {job}
              {character.gold != null && <span style={{ marginLeft: 8, color: '#f0c040' }}>💰{character.gold}G</span>}
            </div>
            <StreakBadge streak={streak} />
          </div>
          {statPoints > 0 && (
            <button onClick={() => setShowStatModal(true)} style={{
              marginLeft: 8, padding: '4px 10px',
              background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
              color: '#fff', border: 'none', borderRadius: 6,
              fontSize: 12, fontFamily: 'monospace', cursor: 'pointer',
              boxShadow: '0 0 10px rgba(124,58,237,0.7)',
              animation: 'stat-pulse 1.2s ease-in-out infinite alternate',
            }}>⬆ +{statPoints}</button>
          )}
        </div>
      )}

      {/* ── 지역명 (상단 중앙) ── */}
      <div style={{
        position: 'fixed', top: 14, left: '50%', transform: 'translateX(-50%)',
        color: '#e8d5a3', fontFamily: 'monospace', fontSize: 15,
        letterSpacing: 2, fontWeight: 'bold',
        textShadow: '0 0 10px rgba(240,192,64,0.5)',
        background: 'rgba(0,0,0,0.35)',
        padding: '5px 18px', borderRadius: 6,
        zIndex: 9999, pointerEvents: 'none',
      }}>🏘️  HeroTalk 마을</div>

      {/* ── 우측 버튼 그룹 ── */}
      <div style={{
        position: 'fixed', top: 14, right: 16,
        display: 'flex', gap: 8, zIndex: 9999, alignItems: 'center',
      }}>
        <button onClick={() => setShowQuestModal(true)}   style={BTN.base}>📋 퀘스트</button>
        <button onClick={() => setShowReviewModal(true)}  style={BTN.base}>📚 복습</button>
        <button onClick={() => setShowShopModal(true)}    style={BTN.base}>🛒 상점</button>
        <button onClick={() => setShowRankingModal(true)} style={BTN.base}>🏆 랭킹</button>
        <button onClick={handleLogout} style={{ ...BTN.base, color: '#8090a0' }}>로그아웃</button>
      </div>

      {/* ── 모달들 ── */}
      {showDungeonModal && <DungeonSelectModal onClose={() => setShowDungeonModal(false)} />}

      {showStatModal && character && (
        <StatAllocateModal
          character={character}
          onClose={() => setShowStatModal(false)}
          onAllocated={(updated) => { setCharacter(updated); charRef.current = updated }}
        />
      )}

      {showShopModal && (
        <ShopModal onClose={() => setShowShopModal(false)} />
      )}

      {showReviewModal && (
        <ReviewModal onClose={() => setShowReviewModal(false)} />
      )}

      {showRankingModal && (
        <RankingModal onClose={() => setShowRankingModal(false)} />
      )}

      {showQuestModal && (
        <QuestModal onClose={() => setShowQuestModal(false)} />
      )}

      {showTutorial && (
        <TutorialOverlay onClose={() => setShowTutorial(false)} />
      )}
    </div>
  )
}

export default GamePage
