import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Phaser from 'phaser'
import GameConfig from '@/game/GameConfig'
import EventBus from '@/game/EventBus'
import useAuthStore from '@/store/authStore'
import useCharacterStore from '@/store/characterStore'
import { getCharacter } from '@/api/characterApi'
import DungeonSelectModal from './game/DungeonSelectModal'

function GamePage() {
  const gameRef = useRef(null)
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const setCharacter = useCharacterStore((state) => state.setCharacter)
  const [showDungeonModal, setShowDungeonModal] = useState(false)

  // Load character info
  useEffect(() => {
    getCharacter()
      .then(setCharacter)
      .catch(() => {
        navigate('/character/create', { replace: true })
      })
  }, [setCharacter, navigate])

  // Initialize Phaser game
  useEffect(() => {
    if (gameRef.current) return
    gameRef.current = new Phaser.Game({
      ...GameConfig,
      parent: containerRef.current,
    })
    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  // EventBus: listen for dungeon-enter event from TownScene
  useEffect(() => {
    const handler = () => setShowDungeonModal(true)
    EventBus.on('dungeon-enter', handler)
    return () => EventBus.off('dungeon-enter', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <button
        onClick={handleLogout}
        style={{
          position: 'fixed', top: '16px', right: '16px',
          padding: '8px 16px',
          background: 'rgba(0, 0, 0, 0.6)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          zIndex: 9999,
        }}
      >
        로그아웃
      </button>

      {showDungeonModal && (
        <DungeonSelectModal onClose={() => setShowDungeonModal(false)} />
      )}
    </div>
  )
}

export default GamePage
