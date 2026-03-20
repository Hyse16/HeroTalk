import Phaser from 'phaser'
import PreloadScene from './scenes/PreloadScene'
import TownScene from './scenes/TownScene'
import BattleScene from './scenes/BattleScene'

const GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: [PreloadScene, TownScene, BattleScene],
}

export default GameConfig
