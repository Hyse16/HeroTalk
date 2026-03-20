import Phaser from 'phaser'

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    // 로딩 바 UI
    const { width, height } = this.cameras.main
    const bar = this.add.graphics()
    const bg = this.add.graphics()

    bg.fillStyle(0x222222).fillRect(width / 2 - 200, height / 2 - 15, 400, 30)
    this.load.on('progress', (value) => {
      bar.clear()
      bar.fillStyle(0x4ade80).fillRect(width / 2 - 198, height / 2 - 13, 396 * value, 26)
    })

    this.add
      .text(width / 2, height / 2 - 40, 'HeroTalk 로딩 중...', {
        fontSize: '20px',
        fill: '#ffffff',
      })
      .setOrigin(0.5)

    // TODO: 실제 에셋 preload 추가
  }

  create() {
    this.scene.start('TownScene')
  }
}
