import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Phaser from 'phaser'
import GameConfig from '@/game/GameConfig'
import useAuthStore from '@/store/authStore'

function GamePage() {
  const gameRef = useRef(null)
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

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
          position: 'fixed',
          top: '16px',
          right: '16px',
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
    </div>
  )
}

export default GamePage
