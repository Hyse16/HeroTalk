import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import GameConfig from '@/game/GameConfig'

function GamePage() {
  const gameRef = useRef(null)
  const containerRef = useRef(null)

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

  return <div ref={containerRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }} />
}

export default GamePage
