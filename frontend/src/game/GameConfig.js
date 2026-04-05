import Phaser from 'phaser'
import PreloadScene from './scenes/PreloadScene'
import TownScene from './scenes/TownScene'
import BattleScene from './scenes/BattleScene'

const GameConfig = {
  type: Phaser.CANVAS,
  width: 1280,
  height: 720,
  backgroundColor: '#0d0d1a',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: [PreloadScene, TownScene, BattleScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}

export default GameConfig
